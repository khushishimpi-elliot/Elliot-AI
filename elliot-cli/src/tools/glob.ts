import fg from "fast-glob";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { registerTool } from "./registry.js";

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
];

// fast-glob doesn't read .gitignore itself; translate its entries into the
// ignore patterns fast-glob understands so generated/vendored files stay out.
function gitignorePatterns(cwd: string): string[] {
  const file = path.join(cwd, ".gitignore");
  if (!existsSync(file)) return [];
  const patterns: string[] = [];
  for (const raw of readFileSync(file, "utf-8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("!")) continue;
    const body = line.replace(/^\/+/, "").replace(/\/+$/, "");
    if (!body) continue;
    patterns.push(`**/${body}/**`, `**/${body}`);
  }
  return patterns;
}

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
    const root = (cwd as string) || process.cwd();
    const files = await fg(pattern as string, {
      cwd: root,
      dot: false,
      ignore: [...DEFAULT_IGNORE, ...gitignorePatterns(root)],
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
