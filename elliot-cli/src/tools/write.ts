import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { registerTool } from "./registry.js";
import { snapshot } from "../agent/undo.js";

registerTool({
  name: "write",
  description:
    "Write a file to the local filesystem, overwriting if it exists. " +
    "ALWAYS prefer editing an existing file over writing a new one. " +
    "If the file exists, read it first. " +
    "Never proactively create README or *.md docs unless the user explicitly asks.",
  permission: "ask",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string" },
      content: { type: "string" },
    },
    required: ["path", "content"],
  },
  async handler({ path, content }) {
    await snapshot(path as string);
    await mkdir(dirname(path as string), { recursive: true });
    await writeFile(path as string, content as string, "utf-8");
    return `Written: ${path}`;
  },
});
