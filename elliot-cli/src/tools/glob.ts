import fg from "fast-glob";
import { registerTool } from "./registry.js";

registerTool({
  name: "glob",
  description:
    "Find files by glob pattern. Pattern examples: '**/*' (all files), " +
    "'**/*.py' (Python files), 'src/**/*.ts' (TypeScript in src/). " +
    "Do NOT pass a directory path as the pattern.",
  permission: "allow",
  inputSchema: {
    type: "object",
    properties: {
      pattern: { type: "string" },
      cwd: { type: "string" },
      limit: { type: "number" },
    },
    required: ["pattern"],
  },
  async handler({ pattern, cwd, limit }) {
    const files = await fg(pattern as string, {
      cwd: (cwd as string) || process.cwd(),
      dot: false,
      ignore: ["**/node_modules/**", "**/.git/**"],
      stats: true,
    });
    const sorted = (
      files as Array<{ path: string; stats?: { mtimeMs: number } }>
    )
      .sort((a, b) => (b.stats?.mtimeMs ?? 0) - (a.stats?.mtimeMs ?? 0))
      .slice(0, (limit as number) ?? 50)
      .map((f) => f.path);
    return sorted.length ? sorted.join("\n") : "No files found";
  },
});
