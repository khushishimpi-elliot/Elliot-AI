import { exec } from "child_process";
import { promisify } from "util";
import { registerTool } from "./registry.js";

const execAsync = promisify(exec);

registerTool({
  name: "grep",
  description:
    "Fast content search across the codebase using a regex. " +
    "Supports full regex syntax (e.g. 'log.*Error', 'function\\s+\\w+'). " +
    "Filter by file type with file_glob (e.g. '*.ts', '*.{js,jsx}'). " +
    "Returns file paths and line numbers with matching lines. " +
    "Use this to find where code/symbols are defined or referenced.",
  permission: "allow",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string" },
      path: { type: "string" },
      file_glob: { type: "string" },
      ignore_case: { type: "boolean" },
    },
    required: ["pattern"],
  },
  async handler({ pattern, path, file_glob, ignore_case }) {
    const target = (path as string) || ".";
    const flag = ignore_case ? "-i" : "";
    const glob = file_glob ? `--glob "${file_glob as string}"` : "";
    const cmd =
      `rg --line-number ${flag} ${glob} "${pattern as string}" ${target} ` +
      `2>/dev/null || grep -rn ${flag} "${pattern as string}" ${target} 2>/dev/null`;
    try {
      const { stdout } = await execAsync(cmd, { cwd: process.cwd() });
      return stdout.trim() || "No matches";
    } catch {
      return "No matches";
    }
  },
});
