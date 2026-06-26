import { streamLLM, type ChatMessage, type ToolCall } from "./provider.js";
import { getToolDefs, executeTool } from "../tools/registry.js";
import { buildSystemPrompt } from "./context.js";
import { beginTurn, commitTurn } from "./undo.js";

// Injected when the agent is on its final allowed step.
// Borrowed from opencode — forces the model to summarise instead of looping.
const MAX_STEPS_PROMPT =
  "MAXIMUM STEPS REACHED. Tools are now disabled. " +
  "Write a concise text summary of: what you accomplished, what remains, and suggested next steps. " +
  "Do NOT call any tools. Text only.";

export class AgentLoop {
  private messages: ChatMessage[] = [];
  private system: string;
  private recentCalls: string[] = []; // last N "tool:args" strings for loop detection

  constructor(agentContext: string) {
    this.system = buildSystemPrompt(agentContext);
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

      if (response.content) finalText = response.content;

      // Empty response with no tool calls — retry plain text
      if (!response.content && !response.tool_calls.length) {
        const plain = await streamLLM(this.messages, [], this.system, onText);
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

      // Execute all tool calls in parallel
      const results = await Promise.all(
        response.tool_calls.map(async (call) => {
          const toolName = call.function.name
            .split("=")[0]
            .split("{")[0]
            .trim();
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
        })
      );

      // Append all tool results to history
      for (const { call, toolName, result } of results) {
        this.messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: toolName,
          content: result,
        });
      }
    }

    commitTurn();
    return finalText || "(done)";
  }

  clearHistory(): void {
    this.messages = [];
  }

  compactHistory(): void {
    if (this.messages.length > 20) {
      this.messages = this.messages.slice(-20);
    }
  }
}
