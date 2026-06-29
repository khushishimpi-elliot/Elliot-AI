import { streamLLM, type ChatMessage, type ToolCall } from "./provider.js";
import { getToolDefs, executeTool } from "../tools/registry.js";
import { buildSystemPrompt } from "./context.js";
import { beginTurn, commitTurn } from "./undo.js";
import { logUsage } from "../usage.js";

// Injected when the agent is on its final allowed step.
// Borrowed from opencode — forces the model to summarise instead of looping.
const MAX_STEPS_PROMPT =
  "MAXIMUM STEPS REACHED. Tools are now disabled. " +
  "Write a concise text summary of: what you accomplished, what remains, and suggested next steps. " +
  "Do NOT call any tools. Text only.";

// Tools that mutate the filesystem — executed serially, never in parallel.
const MUTATING_TOOLS = new Set(["edit", "write"]);

// Some providers prefix/garble tool names (e.g. "edit={...}" or "edit{..."),
// so strip everything after the first '=' or '{' to recover the bare name.
function normalizeToolName(raw: string): string {
  return raw.split("=")[0].split("{")[0].trim();
}

export class AgentLoop {
  private messages: ChatMessage[] = [];
  private system: string;
  private recentCalls: string[] = []; // last N "tool:args" strings for loop detection
  private lastResponse = "";
  private command: "local" | "ask";

  constructor(agentContext: string, command: "local" | "ask" = "local") {
    this.system = buildSystemPrompt(agentContext);
    this.command = command;
  }

  // ── Introspection (used by slash commands) ──────────────────────────────
  /** Rough token estimate: ~4 chars per token across all messages + system. */
  estimatedTokens(): number {
    const chars =
      this.system.length +
      this.messages.reduce((sum, m) => {
        let n = (m.content ?? "").length;
        if (m.tool_calls) n += JSON.stringify(m.tool_calls).length;
        return sum + n;
      }, 0);
    return Math.round(chars / 4);
  }

  messageCount(): number {
    return this.messages.length;
  }

  lastResponseText(): string {
    return this.lastResponse;
  }

  /** Plain-text transcript of the conversation, for /export. */
  exportText(): string {
    const lines: string[] = [];
    for (const m of this.messages) {
      if (m.role === "user" && m.content) lines.push(`> ${m.content}`);
      else if (m.role === "assistant" && m.content) lines.push(`Elliot: ${m.content}`);
      else if (m.role === "assistant" && m.tool_calls?.length)
        lines.push(`Elliot: [called ${m.tool_calls.map((t) => t.function.name).join(", ")}]`);
    }
    return lines.join("\n\n");
  }

  private isStuckLoop(calls: ToolCall[]): boolean {
    const key = calls.map((c) => `${c.function.name}:${c.function.arguments}`).join("|");
    this.recentCalls.push(key);
    if (this.recentCalls.length > 6) this.recentCalls.shift();
    const dupes = this.recentCalls.filter((k) => k === key).length;
    return dupes >= 3;
  }

  async run(
    userPrompt: string,
    onText: (chunk: string) => void,
    onTool: (name: string, args: string) => void,
    onToolResult: (result: string) => void
  ): Promise<string> {
    this.messages.push({ role: "user", content: userPrompt });
    beginTurn();

    let finalText = "";
    let steps = 0;
    const MAX_STEPS = 40;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let lastModelUsed = "";

    while (steps < MAX_STEPS) {
      steps++;
      const isLastStep = steps >= MAX_STEPS;

      // On final step: disable tools and inject the max-steps prompt
      const tools = isLastStep ? [] : getToolDefs();
      const system = isLastStep
        ? `${this.system}\n\n${MAX_STEPS_PROMPT}`
        : this.system;

      const response = await streamLLM(
        this.messages,
        tools,
        system,
        (token) => onText(token)
      );

      totalInputTokens += response.input_tokens;
      totalOutputTokens += response.output_tokens;
      if (response.model_used) lastModelUsed = response.model_used;

      if (response.content) finalText = response.content;

      // Empty response with no tool calls — retry plain text
      if (!response.content && !response.tool_calls.length) {
        const plain = await streamLLM(this.messages, [], this.system, onText);
        totalInputTokens += plain.input_tokens;
        totalOutputTokens += plain.output_tokens;
        if (plain.model_used) lastModelUsed = plain.model_used;
        if (plain.content) finalText = plain.content;
        break;
      }

      if (!response.tool_calls.length || response.stop_reason === "stop") {
        break;
      }

      // Break if the model is calling the exact same tools repeatedly
      if (this.isStuckLoop(response.tool_calls)) {
        onText("\n[Elliot stopped: repeated identical tool calls detected. Try rephrasing your question.]");
        break;
      }

      // Append assistant turn (with tool_calls) to history
      this.messages.push({
        role: "assistant",
        content: response.content,
        tool_calls: response.tool_calls,
      });

      // Execute one tool call and surface it to the UI.
      const execOne = async (call: ToolCall) => {
        const toolName = normalizeToolName(call.function.name);
        onTool(toolName, call.function.arguments);

        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(call.function.arguments);
        } catch {
          // leave empty — tool handler will receive {}
        }

        const result = await executeTool(toolName, input);
        onToolResult(result);
        return { call, toolName, result };
      };

      // Read-only tools can run together; mutating tools (edit/write) must run
      // one at a time so they don't race on the same file or interleave their
      // permission prompts.
      const parallelCalls = response.tool_calls.filter(
        (c) => !MUTATING_TOOLS.has(normalizeToolName(c.function.name))
      );
      const serialCalls = response.tool_calls.filter((c) =>
        MUTATING_TOOLS.has(normalizeToolName(c.function.name))
      );

      const resultById = new Map<string, { toolName: string; result: string }>();
      await Promise.all(
        parallelCalls.map(async (c) => {
          const { toolName, result } = await execOne(c);
          resultById.set(c.id, { toolName, result });
        })
      );
      for (const c of serialCalls) {
        const { toolName, result } = await execOne(c);
        resultById.set(c.id, { toolName, result });
      }

      // Append tool results in the model's original call order
      for (const call of response.tool_calls) {
        const r = resultById.get(call.id);
        if (!r) continue;
        this.messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: r.toolName,
          content: r.result,
        });
      }
    }

    commitTurn();
    this.lastResponse = finalText;

    logUsage({
      command: this.command,
      model: lastModelUsed || "unknown",
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      query_preview: userPrompt.slice(0, 80),
    });

    return finalText || "(done)";
  }

  clearHistory(): void {
    this.messages = [];
  }

  compactHistory(): void {
    const KEEP = 20;
    if (this.messages.length <= KEEP) return;
    let start = this.messages.length - KEEP;
    // Advance to the next clean turn boundary (a user message) so we never
    // keep an orphaned `tool` result whose assistant `tool_calls` got trimmed
    // away — most provider APIs reject that and the next call would 400.
    while (start < this.messages.length && this.messages[start].role !== "user") {
      start++;
    }
    // If no boundary remains (rare), keep the trailing window as-is.
    this.messages = this.messages.slice(
      start < this.messages.length ? start : this.messages.length - KEEP
    );
  }
}
