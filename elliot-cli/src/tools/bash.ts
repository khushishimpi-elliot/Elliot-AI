import { exec } from "child_process";
import { promisify } from "util";
import { registerTool } from "./registry.js";

const execAsync = promisify(exec);
const isWindows = process.platform === "win32";

const MAX_OUTPUT = 30_000; // chars — cap so huge output can't blow the context window

function capOutput(out: string): string {
  if (out.length <= MAX_OUTPUT) return out;
  return (
    out.slice(0, MAX_OUTPUT) +
    `\n\n... [output truncated — ${out.length - MAX_OUTPUT} more chars. ` +
    `Narrow the command, e.g. avoid recursive listings of node_modules.]`
  );
}

// Commands that produce dangerously large output — rewrite to safer forms
function guardCommand(cmd: string): string {
  const c = cmd.trim();
  // 'dir /s' (recursive) on a node project floods with node_modules
  if (/^dir\s+\/s\b/i.test(c) && !/node_modules/i.test(c)) {
    return c + " | findstr /v node_modules";
  }
  return cmd;
}

// Translate common Unix commands to Windows equivalents
function translateCommand(cmd: string): string {
  if (!isWindows) return cmd;
  return cmd
    .replace(/^ls(\s|$)/, "dir$1")
    .replace(/^ls\b/, "dir")
    .replace(/^cat\s+/, "type ")
    .replace(/^rm\s+-rf?\s+/, "rmdir /s /q ")
    .replace(/^rm\s+/, "del ")
    .replace(/^cp\s+/, "copy ")
    .replace(/^mv\s+/, "move ")
    .replace(/^mkdir\s+-p\s+/, "mkdir ")
    .replace(/^touch\s+/, "type nul > ")
    .replace(/^clear$/, "cls")
    .replace(/^pwd$/, "cd")
    .replace(/^which\s+/, "where ");
}

registerTool({
  name: "bash",
  description:
    "Run a shell command. On Windows use Windows commands (dir, type, etc.) " +
    "or standard cross-platform commands (git, npm, node). Returns stdout + stderr. " +
    "To find files prefer the glob tool over recursive 'dir /s'. " +
    "Output is capped at 30k chars — keep commands focused.",
  permission: "allow",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string" },
      cwd: { type: "string" },
      timeout: { type: "number" },
    },
    required: ["command"],
  },
  async handler({ command, cwd, timeout }) {
    const translated = guardCommand(translateCommand(command as string));
    try {
      const { stdout, stderr } = await execAsync(translated, {
        cwd: (cwd as string) || process.cwd(),
        timeout: (timeout as number) || 30_000,
        maxBuffer: 10 * 1024 * 1024, // 10MB — prevent ENOBUFS crash on big output
      });
      const out = [stdout, stderr].filter(Boolean).join("\n---stderr---\n");
      return capOutput(out || "(no output)");
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      const out = (((err.stdout ?? "") + (err.stderr ?? "")).trim());
      return capOutput(out || `Error: ${err.message}`);
    }
  },
});
