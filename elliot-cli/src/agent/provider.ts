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

function toGeminiFunctions(tools: ToolDef[]): FunctionDeclaration[] {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(
        Object.entries(
          (t.function.parameters as { properties?: Record<string, { type: string; description?: string }> })
            .properties ?? {}
        ).map(([k, v]) => [
          k,
          { type: SchemaType.STRING, description: v.description ?? "" },
        ])
      ),
      required:
        (t.function.parameters as { required?: string[] }).required ?? [],
    },
  }));
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
  onToken: (t: string) => void
): Promise<LLMResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: system,
    ...(tools.length ? { tools: [{ functionDeclarations: toGeminiFunctions(tools) }] } : {}),
  });

  // Pass the full conversation as `contents` — this is the format Gemini
  // documents for tool conversations. startChat/sendMessage rejects
  // functionResponse history, so we use generateContent directly.
  const contents = toGeminiHistory(messages, system);

  const stopSpinner = startSpinner();
  try {
    const result = await geminiModel.generateContent({ contents });
    stopSpinner();
    const response = result.response;
    const candidate = response.candidates?.[0];
    if (!candidate) return { content: null, tool_calls: [], stop_reason: "stop" };

    const { parts } = candidate.content;
    const textParts = parts.filter((p: Part) => p.text);
    const fnParts = parts.filter((p: Part) => p.functionCall);

    const textContent = textParts.map((p: Part) => p.text!).join("") || null;
    if (textContent) onToken(textContent);

    const tool_calls: ToolCall[] = fnParts.map((p: Part, i: number) => ({
      id: `gemini_call_${i}`,
      type: "function" as const,
      function: {
        name: p.functionCall!.name,
        arguments: JSON.stringify(p.functionCall!.args ?? {}),
      },
    }));

    return { content: textContent, tool_calls, stop_reason: fnParts.length ? "tool_calls" : "stop" };
  } catch (err) {
    stopSpinner();
    throw err;
  }
}

// ─── OpenAI-compatible call (Groq / OpenRouter) ───────────────────────────────

async function callOpenAI(
  client: OpenAI,
  model: string,
  messages: OpenAI.ChatCompletionMessageParam[],
  tools: ToolDef[],
  onToken: (t: string) => void
): Promise<LLMResponse> {
  if (tools.length > 0) {
    const stopSpinner = startSpinner();
    try {
      const response = await client.chat.completions.create({
        model, max_tokens: 8096, stream: false,
        tools: tools as OpenAI.ChatCompletionTool[], tool_choice: "auto", messages,
      });
      stopSpinner();
      const choice = response.choices[0];
      const content = choice.message.content ?? null;
      if (content) onToken(content);
      const tool_calls = ((choice.message.tool_calls ?? []) as ToolCall[]).map((tc) => ({
        ...tc,
        function: { ...tc.function, name: tc.function.name.split("=")[0].split("{")[0].trim() },
      }));
      return { content, tool_calls, stop_reason: choice.finish_reason ?? "stop" };
    } catch (err) { stopSpinner(); throw err; }
  }

  // Text-only: stream
  const stream = await client.chat.completions.create({
    model, max_tokens: 8096, stream: true, messages,
  });
  let content = ""; let stopReason = "stop";
  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;
    stopReason = choice.finish_reason ?? stopReason;
    if (choice.delta.content) { content += choice.delta.content; onToken(choice.delta.content); }
  }
  return { content: content || null, tool_calls: [], stop_reason: stopReason };
}

// ─── Provider registry ────────────────────────────────────────────────────────

type CallFn = (model: string, messages: ChatMessage[], tools: ToolDef[], system: string, onToken: (t: string) => void) => Promise<LLMResponse>;

interface Provider { name: string; models: string[]; call: CallFn; }

function buildProviders(baseMessages: ChatMessage[]): Provider[] {
  const list: Provider[] = [];

  const gm = geminiKey();
  if (gm) {
    list.push({
      name: "Gemini",
      models: ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"],
      call: (model, msgs, tools, system, onToken) =>
        callGemini(gm, model, msgs, tools, system, onToken),
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
      call: (model, _msgs, tools, system, onToken) => {
        const msgs = [
          { role: "system" as const, content: system },
          ...baseMessages,
        ] as OpenAI.ChatCompletionMessageParam[];
        void oaiMsgs; // suppress lint
        return callOpenAI(client, model, msgs, tools, onToken);
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
      call: (model, _msgs, tools, system, onToken) => {
        const msgs = [
          { role: "system" as const, content: system },
          ...baseMessages,
        ] as OpenAI.ChatCompletionMessageParam[];
        return callOpenAI(client, model, msgs, tools, onToken);
      },
    });
  }

  if (list.length === 0) throw new Error("No API key found. Add GEMINI_API_KEY or GROQ_API_KEY to elliot-cli/.env");
  return list;
}

// ─── Session-level exhaustion cache ──────────────────────────────────────────
const exhaustedProviders = new Set<string>();

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function streamLLM(
  messages: ChatMessage[],
  tools: ToolDef[],
  system: string,
  onToken: (token: string) => void
): Promise<LLMResponse> {
  const providers = buildProviders(messages).filter((p) => !exhaustedProviders.has(p.name));

  for (const provider of providers) {
    let worked = false;
    for (const model of provider.models) {
      try {
        const result = await provider.call(model, messages, tools, system, onToken);
        worked = true;
        return result;
      } catch (err) {
        if (isSkippable(err)) continue;
        if (isBadToolCall(err) && tools.length > 0) {
          const result = await provider.call(model, messages, [], system, onToken);
          worked = true;
          return result;
        }
        if (isContextOverflow(err)) throw new Error("Context too long. Use /compact to trim history.");
        throw err;
      }
    }
    if (!worked) {
      exhaustedProviders.add(provider.name);
      process.stdout.write(`\n  [${provider.name} unavailable, trying next...]\n`);
    }
  }

  exhaustedProviders.clear();
  throw new Error("All providers unavailable.\n  • Groq resets hourly\n  • Gemini: check aistudio.google.com");
}

export async function callLLM(messages: ChatMessage[], tools: ToolDef[], system: string): Promise<LLMResponse> {
  return streamLLM(messages, tools, system, () => {});
}
