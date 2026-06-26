import * as readline from "readline";

export type ToolHandler = (input: Record<string, unknown>) => Promise<string>;
export type Permission = "allow" | "ask" | "deny";

export interface ToolEntry {
  name: string;
  description: string;
  inputSchema: object;
  permission: Permission;
  handler: ToolHandler;
}

export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: object };
}

const registry = new Map<string, ToolEntry>();

export function registerTool(entry: ToolEntry): void {
  registry.set(entry.name, entry);
}

export function getToolDefs(): ToolDef[] {
  return [...registry.values()].map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));
}

async function askPermission(name: string, input: unknown): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const preview = JSON.stringify(input, null, 2).slice(0, 300);
  process.stdout.write(`\n[permission] ${name}\n${preview}\nAllow? [y/N] `);
  return new Promise((resolve) => {
    rl.once("line", (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const tool = registry.get(name);
  if (!tool) return `Error: unknown tool "${name}"`;
  if (tool.permission === "deny") return `Error: tool "${name}" is denied`;
  if (tool.permission === "ask") {
    const allowed = await askPermission(name, input);
    if (!allowed) return `User denied permission for "${name}"`;
  }
  try {
    return await tool.handler(input);
  } catch (err) {
    return `Error in ${name}: ${(err as Error).message}`;
  }
}
