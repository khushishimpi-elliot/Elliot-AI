import { readdir } from "fs/promises";
import path from "path";
import { registerTool } from "./registry.js";

// Directories that are almost never what the user wants to see listed.
const ALWAYS_IGNORE = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "__pycache__",
  ".venv",
]);

const MAX_ENTRIES = 200;

registerTool({
  name: "list",
  description:
    "List the contents of a directory (one level). Directories are shown with " +
    "a trailing '/'. Skips noise like node_modules, .git, dist. " +
    "Use this to explore project structure; use glob to find files by pattern.",
  permission: "allow",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory to list (default: cwd)" },
    },
  },
  async handler({ path: dir }) {
    const target = path.resolve(process.cwd(), (dir as string) || ".");
    let entries;
    try {
      entries = await readdir(target, { withFileTypes: true });
    } catch (err) {
      return `Error: cannot list ${target}: ${(err as Error).message}`;
    }

    const visible = entries.filter(
      (e) => !ALWAYS_IGNORE.has(e.name) && !e.name.startsWith(".")
    );
    // Directories first, then files; alphabetical within each.
    visible.sort((a, b) => {
      const ad = a.isDirectory() ? 0 : 1;
      const bd = b.isDirectory() ? 0 : 1;
      return ad - bd || a.name.localeCompare(b.name);
    });

    const lines = visible
      .slice(0, MAX_ENTRIES)
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));

    if (!lines.length) return `(empty: ${target})`;
    const more =
      visible.length > MAX_ENTRIES
        ? `\n... ${visible.length - MAX_ENTRIES} more (narrow with glob)`
        : "";
    return `${target}\n${lines.join("\n")}${more}`;
  },
});
