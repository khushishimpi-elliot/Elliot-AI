import chalk from "chalk";
import { registerTool } from "./registry.js";

type Status = "pending" | "in_progress" | "completed";

interface Todo {
  text: string;
  status: Status;
}

// Session-scoped plan. The agent rewrites the whole list each call (same model
// as this harness's TodoWrite) so state stays consistent and easy to reason about.
let todos: Todo[] = [];

const MARK: Record<Status, string> = {
  pending: "[ ]",
  in_progress: "[~]",
  completed: "[x]",
};

function render(): string {
  if (!todos.length) return "(no todos)";
  return todos
    .map((t) => `${MARK[t.status]} ${t.text}`)
    .join("\n");
}

// Show the current plan to the user — the loop only feeds tool results back to
// the model, so without this the checklist would be invisible.
function print(): void {
  const color = (t: Todo) =>
    t.status === "completed"
      ? chalk.hex("#888888")(`${MARK.completed} ${t.text}`)
      : t.status === "in_progress"
        ? chalk.hex("#F0C040")(`${MARK.in_progress} ${t.text}`)
        : chalk.hex("#79C0FF")(`${MARK.pending} ${t.text}`);
  process.stdout.write(
    "\n" + todos.map((t) => "  " + color(t)).join("\n") + "\n"
  );
}

registerTool({
  name: "todo",
  description:
    "Track a multi-step task as a checklist. Pass the FULL list every time " +
    "(it replaces the previous one). Use for non-trivial work: add the steps " +
    "up front, mark exactly one 'in_progress' as you go, and 'completed' when " +
    "each finishes. Skip it for trivial single-step tasks.",
  permission: "allow",
  inputSchema: {
    type: "object",
    properties: {
      todos: {
        type: "array",
        items: {
          type: "object",
          properties: {
            text: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed"],
            },
          },
          required: ["text", "status"],
        },
      },
    },
    required: ["todos"],
  },
  async handler({ todos: incoming }) {
    if (!Array.isArray(incoming)) return "Error: todos must be an array";
    todos = (incoming as Todo[])
      .filter((t) => t && typeof t.text === "string")
      .map((t) => ({
        text: t.text,
        status: (["pending", "in_progress", "completed"] as Status[]).includes(
          t.status
        )
          ? t.status
          : "pending",
      }));
    print();
    return `Plan updated (${todos.length} item(s)):\n${render()}`;
  },
});
