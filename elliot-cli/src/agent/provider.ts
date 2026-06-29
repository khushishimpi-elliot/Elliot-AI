import OpenAI from "openai";
import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type FunctionDeclaration,
  type Part,
} from "@google/generative-ai";
import { readFileSync } from "fs";
import { homedir } from "os";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

function readConfig(): Record<string, string> {
  const p = path.join(homedir(), ".elliot", "config.json");
  return JSON.parse(readFileSync(p, "utf-8"));
}

function loadKey(envVar: string, configKey: string): string | null {
  if (process.env[envVar]) return process.env[envVar]!;
  try { return readConfig()[configKey] ?? null; } catch { return null; }
}

const geminiKey  = () => loadKey("GEMINI_API_KEY",      "gemini_api_key");
const groqKey    = () => loadKey("GROQ_API_KEY",         "groq_api_key");
const orKey      = () => loadKey("OPENROUTER_API_KEY",   "openrouter_api_key");

// ── Session model override (set via /model) ──────────────────────────────────
let modelOverride: string | null = null;

export function setModelOverride(model: string | null): void {
  modelOverride = model;
}

/** Status of every provider — which has a key and which models it offers. */
export function getProviderStatus(): Array<{ name: string; hasKey: boolean; models: string[] }> {
  return [
    { name: "Gemini", hasKey: !!geminiKey(), models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"] },
    { name: "Groq", hasKey: !!groqKey(), models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"] },
    { name: "OpenRouter", hasKey: !!orKey(), models: ["meta-llama/llama-3.3-70b-instruct:free", "nousresearch/hermes-3-llama-3.1-405b:free"] },
  ];
}

/** Name of the provider that will be tried first (has a key). */
export function activeProviderName(): string {
  return getProviderStatus().find((p) => p.hasKey)?.name ?? "none";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: object };
}

export interface LLMResponse {
  content: string | null;
  tool_calls: ToolCall[];
  stop_reason: string;
  input_tokens: number;
  output_tokens: number;
  model_used: string;
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function isSkippable(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? "");
  const status = (err as { status?: number })?.status;
  return (
    status === 429 || status === 413 || status === 404 || status === 503 ||
    msg.includes("429") || msg.includes("413") || msg.includes("404") || msg.includes("503") ||
    msg.includes("Service Unavailable") || msg.includes("high demand") ||
    msg.includes("rate limit") || msg.includes("Request too large") ||
    msg.includes("Provider returned error") || msg.includes("decommissioned") ||
    msg.includes("No endpoints found") || msg.includes("deprecated") ||
    msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("not found") || msg.includes("Not Found")
  );
}

function isBadToolCall(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? "");
  return (
    (err as { status?: number })?.status === 400 ||
    msg.includes("Failed to call a function") ||
    msg.includes("failed_generation") ||
    msg.includes("tool_use_failed")
  );
}

function isContextOverflow(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? "");
  return (
    msg.includes("context_length_exceeded") ||
    msg.includes("maximum context length") ||
    msg.includes("too many tokens")
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

function startSpinner(): () => void {
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r  ${FRAMES[i++ % FRAMES.length]} thinking...`);
  }, 100);
  return () => { clearInterval(id); process.stdout.write("\r\x1b[K"); };
}

// ─── Gemini native call ───────────────────────────────────────────────────────

// JSON-schema "type" → Gemini SchemaType. Preserving the real type matters:
// flattening everything to STRING makes Gemini pass numbers/arrays as strings.
function toGeminiType(t: string | undefined): SchemaType {
  switch (t) {
    case "number": return SchemaType.NUMBER;
    case "integer": return SchemaType.INTEGER;
    case "boolean": return SchemaType.BOOLEAN;
    case "array": return SchemaType.ARRAY;
    case "object": return SchemaType.OBJECT;
    default: return SchemaType.STRING;
  }
}

interface JsonSchemaProp {
  type?: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProp;
  properties?: Record<string, JsonSchemaProp>;
  required?: string[];
}

// Recursively convert a JSON-schema property to a Gemini schema node.
function toGeminiSchema(prop: JsonSchemaProp): Record<string, unknown> {
  const node: Record<string, unknown> = { type: toGeminiType(prop.type) };
  if (prop.description) node.description = prop.description;
  if (prop.enum) node.enum = prop.enum;
  if (prop.type === "array" && prop.items) node.items = toGeminiSchema(prop.items);
  if (prop.type === "object" && prop.properties) {
    node.properties = Object.fromEntries(
      Object.entries(prop.properties).map(([k, v]) => [k, toGeminiSchema(v)])
    );
    if (prop.required) node.required = prop.required;
  }
  return node;
}

function toGeminiFunctions(tools: ToolDef[]): FunctionDeclaration[] {
  return tools.map((t) => {
    const params = t.function.parameters as JsonSchemaProp;
    return {
      name: t.function.name,
      description: t.function.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: Object.fromEntries(
          Object.entries(params.properties ?? {}).map(([k, v]) => [
            k,
            toGeminiSchema(v),
          ])
        ),
        required: params.required ?? [],
      },
    } as unknown as FunctionDeclaration;
  });
}

function toGeminiHistory(messages: ChatMessage[], system: string): Content[] {
  const history: Content[] = [];
  let pendingToolCalls: ToolCall[] = [];

  for (const msg of messages) {
    if (msg.role === "system") continue;

    if (msg.role === "user") {
      if (msg.content) {
        history.push({ role: "user", parts: [{ text: msg.content }] });
      }
    } else if (msg.role === "assistant") {
      const parts: Part[] = [];
      if (msg.content) parts.push({ text: msg.content });
      if (msg.tool_calls?.length) {
        pendingToolCalls = msg.tool_calls;
        for (const tc of msg.tool_calls) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(tc.function.arguments); } catch {}
          parts.push({ functionCall: { name: tc.function.name, args } });
        }
      }
      if (parts.length) history.push({ role: "model", parts });
    } else if (msg.role === "tool") {
      const tc = pendingToolCalls.find((c) => c.id === msg.tool_call_id);
      history.push({
        role: "user",
        parts: [{
          functionResponse: {
            name: tc?.function.name ?? msg.name ?? "tool",
            response: { result: msg.content ?? "" },
          },
        }],
      });
    }
  }
  return history;
}

async function callGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  tools: ToolDef[],
  system: string,
  onToken: (t: string) => void,
  signal?: AbortSignal
): Promise<LLMResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: system,
    ...(tools.length ? { tools: [{ functionDeclarations: toGeminiFunctions(tools) }] } : {}),
  });

  // Pass the full conversation as `contents` — this is the format Gemini
  // documents for tool conversations. startChat/sendMessage rejects
  // functionResponse history, so we use generateContentStream directly.
  const contents = toGeminiHistory(messages, system);

  const stopSpinner = startSpinner();
  let spinning = true;
  const stop = () => { if (spinning) { stopSpinner(); spinning = false; } };
  try {
    const result = await geminiModel.generateContentStream(
      { contents },
      signal ? { signal } : undefined
    );

    // Always keep a handler on the response promise so an abort/error can't
    // surface as an unhandled rejection if we return or throw before reading it.
    const responsePromise = result.response;
    responsePromise.catch(() => {});

    // Stream text as it arrives. Read parts directly rather than chunk.text()
    // so function-call chunks don't trigger the SDK's "no text" warning.
    let textContent = "";
    for await (const chunk of result.stream) {
      if (signal?.aborted) {
        stop();
        return { content: textContent || null, tool_calls: [], stop_reason: "aborted", input_tokens: 0, output_tokens: 0, model_used: model };
      }
      const parts = chunk.candidates?.[0]?.content?.parts ?? [];
      for (const p of parts as Part[]) {
        if (p.text) { stop(); textContent += p.text; onToken(p.text); }
      }
    }
    stop();

    const response = await responsePromise;
    const candidate = response.candidates?.[0];
    if (!candidate) return { content: textContent || null, tool_calls: [], stop_reason: "stop", input_tokens: 0, output_tokens: 0, model_used: model };

    const fnParts = candidate.content.parts.filter((p: Part) => p.functionCall);
    const tool_calls: ToolCall[] = fnParts.map((p: Part, i: number) => ({
      id: `gemini_call_${i}`,
      type: "function" as const,
      function: {
        name: p.functionCall!.name,
        arguments: JSON.stringify(p.functionCall!.args ?? {}),
      },
    }));

    const usage = response.usageMetadata;
    return {
      content: textContent || null,
      tool_calls,
      stop_reason: fnParts.length ? "tool_calls" : "stop",
      input_tokens: usage?.promptTokenCount ?? 0,
      output_tokens: usage?.candidatesTokenCount ?? 0,
      model_used: model,
    };
  } catch (err) {
    stop();
    throw err;
  }
}

// ─── OpenAI-compatible call (Groq / OpenRouter) ───────────────────────────────

async function callOpenAI(
  client: OpenAI,
  model: string,
  messages: OpenAI.ChatCompletionMessageParam[],
  tools: ToolDef[],
  onToken: (t: string) => void,
  signal?: AbortSignal
): Promise<LLMResponse> {
  if (tools.length > 0) {
    const stopSpinner = startSpinner();
    let spinning = true;
    const stop = () => { if (spinning) { stopSpinner(); spinning = false; } };
    try {
      const stream = await client.chat.completions.create(
        {
          model, max_tokens: 8096, stream: true,
          stream_options: { include_usage: true },
          tools: tools as OpenAI.ChatCompletionTool[], tool_choice: "auto", messages,
        },
        signal ? { signal } : undefined
      );

      let content = ""; let stopReason = "stop"; let inputTok = 0; let outputTok = 0;
      // Tool-call fragments arrive split across chunks, keyed by index.
      const toolAcc = new Map<number, { id: string; name: string; args: string }>();

      for await (const chunk of stream) {
        if (signal?.aborted) break;
        const choice = chunk.choices[0];
        if (!choice) {
          if (chunk.usage) { inputTok = chunk.usage.prompt_tokens; outputTok = chunk.usage.completion_tokens; }
          continue;
        }
        stopReason = choice.finish_reason ?? stopReason;
        if (choice.delta?.content) { stop(); content += choice.delta.content; onToken(choice.delta.content); }
        for (const tc of choice.delta?.tool_calls ?? []) {
          const idx = tc.index ?? 0;
          const cur = toolAcc.get(idx) ?? { id: "", name: "", args: "" };
          if (tc.id) cur.id = tc.id;
          if (tc.function?.name) cur.name += tc.function.name;
          if (tc.function?.arguments) cur.args += tc.function.arguments;
          toolAcc.set(idx, cur);
        }
      }
      stop();

      const tool_calls: ToolCall[] = [...toolAcc.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([i, t]) => ({
          id: t.id || `call_${i}`,
          type: "function" as const,
          function: { name: t.name.split("=")[0].split("{")[0].trim(), arguments: t.args || "{}" },
        }));

      return {
        content: content || null,
        tool_calls,
        stop_reason: signal?.aborted ? "aborted" : stopReason,
        input_tokens: inputTok,
        output_tokens: outputTok,
        model_used: model,
      };
    } catch (err) { stop(); throw err; }
  }

  // Text-only: stream
  const stream = await client.chat.completions.create(
    {
      model, max_tokens: 8096, stream: true, stream_options: { include_usage: true }, messages,
    },
    signal ? { signal } : undefined
  );
  let content = ""; let stopReason = "stop"; let inputTok = 0; let outputTok = 0;
  for await (const chunk of stream) {
    if (signal?.aborted) break;
    const choice = chunk.choices[0];
    if (!choice) {
      if (chunk.usage) { inputTok = chunk.usage.prompt_tokens; outputTok = chunk.usage.completion_tokens; }
      continue;
    }
    stopReason = choice.finish_reason ?? stopReason;
    if (choice.delta.content) { content += choice.delta.content; onToken(choice.delta.content); }
  }
  return { content: content || null, tool_calls: [], stop_reason: signal?.aborted ? "aborted" : stopReason, input_tokens: inputTok, output_tokens: outputTok, model_used: model };
}

// ─── Provider registry ────────────────────────────────────────────────────────

type CallFn = (model: string, messages: ChatMessage[], tools: ToolDef[], system: string, onToken: (t: string) => void, signal?: AbortSignal) => Promise<LLMResponse>;

interface Provider { name: string; models: string[]; call: CallFn; }

function buildProviders(baseMessages: ChatMessage[]): Provider[] {
  const list: Provider[] = [];

  const gm = geminiKey();
  if (gm) {
    list.push({
      name: "Gemini",
      models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
      call: (model, msgs, tools, system, onToken, signal) =>
        callGemini(gm, model, msgs, tools, system, onToken, signal),
    });
  }

  const gk = groqKey();
  if (gk) {
    const client = new OpenAI({ apiKey: gk, baseURL: "https://api.groq.com/openai/v1" });
    const oaiMsgs = [
      { role: "system" as const, content: "" }, // placeholder, replaced per-call
      ...baseMessages,
    ] as OpenAI.ChatCompletionMessageParam[];
    list.push({
      name: "Groq",
      models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"],
      call: (model, _msgs, tools, system, onToken, signal) => {
        const msgs = [
          { role: "system" as const, content: system },
          ...baseMessages,
        ] as OpenAI.ChatCompletionMessageParam[];
        void oaiMsgs; // suppress lint
        return callOpenAI(client, model, msgs, tools, onToken, signal);
      },
    });
  }

  const ok = orKey();
  if (ok) {
    const client = new OpenAI({
      apiKey: ok, baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: { "HTTP-Referer": "https://elliot.systems", "X-Title": "elliot-ai" },
    });
    list.push({
      name: "OpenRouter",
      models: ["meta-llama/llama-3.3-70b-instruct:free", "nousresearch/hermes-3-llama-3.1-405b:free"],
      call: (model, _msgs, tools, system, onToken, signal) => {
        const msgs = [
          { role: "system" as const, content: system },
          ...baseMessages,
        ] as OpenAI.ChatCompletionMessageParam[];
        return callOpenAI(client, model, msgs, tools, onToken, signal);
      },
    });
  }

  if (list.length === 0) throw new Error("No API key found. Add GEMINI_API_KEY or GROQ_API_KEY to elliot-cli/.env");

  // If the user pinned a model via /model, move its provider to front and try it first.
  if (modelOverride) {
    const owner = list.find((p) => p.models.includes(modelOverride!));
    if (owner) {
      owner.models = [modelOverride, ...owner.models.filter((m) => m !== modelOverride)];
      list.sort((a, b) => (a === owner ? -1 : b === owner ? 1 : 0));
    }
  }

  return list;
}

// ─── Session-level exhaustion cache ──────────────────────────────────────────
const exhaustedProviders = new Set<string>();

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function streamLLM(
  messages: ChatMessage[],
  tools: ToolDef[],
  system: string,
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<LLMResponse> {
  const providers = buildProviders(messages).filter((p) => !exhaustedProviders.has(p.name));

  for (const provider of providers) {
    if (signal?.aborted) break;
    let worked = false;
    for (const model of provider.models) {
      if (signal?.aborted) break;
      try {
        const result = await provider.call(model, messages, tools, system, onToken, signal);
        worked = true;
        return result;
      } catch (err) {
        if (signal?.aborted) throw err; // don't fall through to other providers
        if (isSkippable(err)) continue;
        if (isBadToolCall(err) && tools.length > 0) {
          const result = await provider.call(model, messages, [], system, onToken, signal);
          worked = true;
          return { ...result, model_used: model };
        }
        if (isContextOverflow(err)) throw new Error("Context too long. Use /compact to trim history.");
        throw err;
      }
    }
    if (signal?.aborted) break;
    if (!worked) {
      exhaustedProviders.add(provider.name);
      process.stdout.write(`\n  [${provider.name} unavailable, trying next...]\n`);
    }
  }

  if (signal?.aborted) {
    return { content: null, tool_calls: [], stop_reason: "aborted", input_tokens: 0, output_tokens: 0, model_used: "" };
  }

  exhaustedProviders.clear();
  throw new Error("All providers unavailable.\n  • Groq resets hourly\n  • Gemini: check aistudio.google.com");
}

export async function callLLM(messages: ChatMessage[], tools: ToolDef[], system: string): Promise<LLMResponse> {
  return streamLLM(messages, tools, system, () => {});
}
