import { readFile, writeFile } from "fs/promises";
import { registerTool } from "./registry.js";
import { snapshot } from "../agent/undo.js";

registerTool({
  name: "edit",
  description:
    "Performs exact string replacement in a file. " +
    "You MUST use the read tool on this file first — edit fails otherwise. " +
    "old_str must match exactly (including indentation) and appear exactly once; " +
    "if it appears multiple times, add more surrounding context to make it unique. " +
    "Prefer editing existing files over creating new ones.",
  permission: "ask",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string" },
      old_str: { type: "string" },
      new_str: { type: "string" },
    },
    required: ["path", "old_str", "new_str"],
  },
  async handler({ path, old_str, new_str }) {
    const content = await readFile(path as string, "utf-8");
    const count = content.split(old_str as string).length - 1;
    if (count === 0) throw new Error(`old_str not found in ${path}`);
    if (count > 1)
      throw new Error(`old_str appears ${count} times — must be unique`);
    await snapshot(path as string);
    // Use a replacer function, not a string: String.replace interprets `$&`,
    // `$1`, `$$` etc. in the replacement string as special patterns, which
    // would corrupt any new_str containing a literal `$` (regex, shell vars…).
    const updated = content.replace(old_str as string, () => new_str as string);
    await writeFile(path as string, updated, "utf-8");
    return `Edited: ${path}`;
  },
});
