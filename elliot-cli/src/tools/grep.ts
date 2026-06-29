import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import path from "path";
import fg from "fast-glob";
import { registerTool } from "./registry.js";

const execAsync = promisify(exec);

const MAX_LINES = 200;
const MAX_CHARS = 20_000;

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
];

// Cap results so a broad pattern can't flood the model's context window.
function cap(out: string): string {
  let lines = out.split("\n");
  let truncated = lines.length > MAX_LINES;
  if (truncated) lines = lines.slice(0, MAX_LINES);
  let text = lines.join("\n");
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    truncated = true;
  }
  return truncated
    ? text + "\n... [results truncated — narrow the pattern or set file_glob]"
    : text;
}

// Fast path: ripgrep if available (respects .gitignore, very fast).
async function ripgrep(
  pattern: string,
  target: string,
  fileGlob: string | undefined,
  ignoreCase: boolean
): Promise<string | null> {
  const args = ["--line-number", "--no-heading", "--color", "never"];
  if (ignoreCase) args.push("-i");
  if (fileGlob) args.push("--glob", fileGlob);
  // Quote pattern/target so spaces and metacharacters survive the shell.
  const cmd = `rg ${args.join(" ")} ${JSON.stringify(pattern)} ${JSON.stringify(target)}`;
  try {
    const { stdout } = await execAsync(cmd, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (err) {
    // rg exits 1 on "no matches" (stdout empty) — that's a valid result.
    // A missing binary shows up as ENOENT/127, OR (via cmd.exe on Windows /
    // sh on unix) as an exit-1 with a "not recognized"/"not found" message on
    // stderr. In those cases return null so the portable scan takes over.
    const e = err as { code?: number | string; stdout?: string; stderr?: string };
    const stderr = e.stderr ?? "";
    const missing =
      e.code === "ENOENT" ||
      e.code === 127 ||
      /not recognized|not found|no such file/i.test(stderr);
    if (missing) return null;
    return (e.stdout ?? "").trim();
  }
}

// Portable fallback: scan files ourselves. Works with no external binaries
// (important on Windows, where rg/grep are usually absent).
async function jsGrep(
  pattern: string,
  target: string,
  fileGlob: string | undefined,
  ignoreCase: boolean
): Promise<string> {
  let re: RegExp;
  try {
    re = new RegExp(pattern, ignoreCase ? "i" : "");
  } catch {
    return `Error: invalid regex /${pattern}/`;
  }

  const files = await fg(fileGlob ? `**/${fileGlob}` : "**/*", {
    cwd: target,
    dot: false,
    ignore: DEFAULT_IGNORE,
    onlyFiles: true,
  });

  const out: string[] = [];
  for (const rel of files) {
    let content: string;
    try {
      content = await readFile(path.join(target, rel), "utf-8");
    } catch {
      continue;
    }
    if (content.includes("\x00")) continue; // skip binary files
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        out.push(`${rel}:${i + 1}:${lines[i].trim()}`);
        if (out.length >= MAX_LINES) return out.join("\n");
      }
    }
  }
  return out.join("\n");
}

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
  async handler({ pattern, path: searchPath, file_glob, ignore_case }) {
    const target = (searchPath as string) || ".";
    const ic = !!ignore_case;

    const rgResult = await ripgrep(
      pattern as string,
      target,
      file_glob as string | undefined,
      ic
    );
    if (rgResult !== null) {
      return cap(rgResult) || "No matches";
    }

    // rg not installed — portable scan.
    const jsResult = await jsGrep(
      pattern as string,
      target,
      file_glob as string | undefined,
      ic
    );
    return cap(jsResult) || "No matches";
  },
});
