import { readFile } from "fs/promises";
import { registerTool } from "./registry.js";

registerTool({
  name: "read",
  description:
    "Read a file's contents. " +
    "Path must be a FILE, not a directory (use glob or bash 'dir' to list directories). " +
    "Call this in parallel when you need to read multiple files. " +
    "Avoid tiny repeated slices — read a larger window if you need more context. " +
    "Example path: 'src/main.py' or 'package.json'.",
  permission: "allow",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string" },
      start_line: { type: "number" },
      end_line: { type: "number" },
    },
    required: ["path"],
  },
  async handler({ path, start_line, end_line }) {
    const content = await readFile(path as string, "utf-8");
    if (start_line || end_line) {
      const lines = content.split("\n");
      const s = ((start_line as number) ?? 1) - 1;
      const e = (end_line as number) ?? lines.length;
      return lines.slice(s, e).join("\n");
    }
    return content;
  },
});
