import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import chalk from "chalk";
import { AgentLoop } from "../agent/loop.js";
import { loadAgentContext } from "../agent/context.js";
import { handleSlash } from "./slash.js";
import { setPermissionPrompt } from "../tools/registry.js";

// Tool registrations — side-effect imports, must come before AgentLoop is used
import "../tools/read.js";
import "../tools/write.js";
import "../tools/edit.js";
import "../tools/bash.js";
import "../tools/grep.js";
import "../tools/glob.js";
import "../tools/list.js";
import "../tools/todo.js";

// Load .env from the elliot-cli directory if present
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

const GREEN = "#4FFFB0";
const BLUE = "#58A6FF";
const GRAY = "#888888";
const CYAN = "#79C0FF";

const MAX_PREVIEW_LINES = 40;

// Render a human-readable preview of what a tool is about to do, so the user
// approves a real diff instead of a wall of raw JSON.
function renderPreview(name: string, input: unknown): string {
  const obj = (input ?? {}) as Record<string, unknown>;

  const clip = (lines: string[], color: (s: string) => string, sign: string) => {
    const shown = lines.slice(0, MAX_PREVIEW_LINES).map((l) => color(`  ${sign} ${l}`));
    if (lines.length > MAX_PREVIEW_LINES)
      shown.push(chalk.hex(GRAY)(`  … ${lines.length - MAX_PREVIEW_LINES} more line(s)`));
    return shown.join("\n");
  };

  if (name === "edit" && typeof obj.old_str === "string" && typeof obj.new_str === "string") {
    return (
      chalk.hex(GRAY)(`  ${obj.path}\n`) +
      clip(String(obj.old_str).split("\n"), chalk.red, "-") +
      "\n" +
      clip(String(obj.new_str).split("\n"), chalk.green, "+")
    );
  }

  if (name === "write" && typeof obj.content === "string") {
    return (
      chalk.hex(GRAY)(`  ${obj.path} (new contents)\n`) +
      clip(String(obj.content).split("\n"), chalk.green, "+")
    );
  }

  return chalk.hex(GRAY)(JSON.stringify(input, null, 2).slice(0, 300));
}

function printBanner(): void {
  const W = 44; // inner width (between the vertical borders)

  // Pad based on the VISIBLE length, which we pass explicitly — the rendered
  // string carries invisible ANSI color codes, so its .length can't be used.
  const row = (rendered: string, visibleLen: number): string =>
    chalk.hex(GREEN)("│") +
    rendered +
    " ".repeat(Math.max(0, W - visibleLen)) +
    chalk.hex(GREEN)("│");

  // Show the tail of the path (most relevant) with a leading ellipsis if long.
  let cwd = process.cwd();
  const cwdMax = W - 2; // account for the 2 leading spaces
  if (cwd.length > cwdMax) cwd = "…" + cwd.slice(cwd.length - (cwdMax - 1));

  const title = "  ELLIOT-AI  ";
  const mode = "local mode";

  console.log("");
  console.log(chalk.hex(GREEN)("┌" + "─".repeat(W) + "┐"));
  console.log(row(title + chalk.hex(GRAY)(mode), title.length + mode.length));
  console.log(row("  " + chalk.hex(GRAY)(cwd), 2 + cwd.length));
  console.log(chalk.hex(GREEN)("└" + "─".repeat(W) + "┘"));
  console.log(chalk.hex(GRAY)("  Type your question, or /help for commands."));
  console.log("");
}

export async function localCommand(): Promise<void> {
  // Validate API key is reachable (provider reads from config or env).
  // Must cover every provider the agent supports — Gemini is the default.
  const hasEnvKey = !!(
    process.env.GEMINI_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENROUTER_API_KEY
  );
  const hasConfigKey = (() => {
    try {
      const p = path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        ".elliot",
        "config.json"
      );
      const cfg = JSON.parse(fs.readFileSync(p, "utf-8"));
      return !!(
        cfg.gemini_api_key ||
        cfg.groq_api_key ||
        cfg.openrouter_api_key ||
        cfg.apiKey
      );
    } catch {
      return false;
    }
  })();

  if (!hasEnvKey && !hasConfigKey) {
    console.error(
      chalk.red("✗ No API key found.\n") +
        chalk.hex(GRAY)(
          "  Add GEMINI_API_KEY (free at aistudio.google.com), GROQ_API_KEY, or\n" +
          "  OPENROUTER_API_KEY to elliot-cli/.env, or run: elliot-ai init"
        )
    );
    process.exit(1);
  }

  printBanner();

  const agentContext = await loadAgentContext();
  const loop = new AgentLoop(agentContext);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const prompt = (): Promise<string> =>
    new Promise((resolve) => {
      rl.question(chalk.hex(GREEN)("› "), (answer) => {
        resolve(answer);
      });
    });

  // Route tool permission prompts through the REPL's single stdin reader
  // instead of letting the registry spin up a second, conflicting readline.
  setPermissionPrompt(
    (name, input) =>
      new Promise((resolve) => {
        rl.question(
          chalk.hex(CYAN)(`\n  permission → ${name}\n`) +
            renderPreview(name, input) +
            chalk.hex(GREEN)("\n  Allow? [y/N] "),
          (answer) => resolve(answer.trim().toLowerCase() === "y")
        );
      })
  );

  rl.on("close", () => {
    console.log(chalk.hex(GRAY)("\nBye!"));
    process.exit(0);
  });

  // Ctrl-C: interrupt the running turn if there is one; otherwise quit.
  let currentAbort: AbortController | null = null;
  rl.on("SIGINT", () => {
    if (currentAbort && !currentAbort.signal.aborted) {
      currentAbort.abort();
      process.stdout.write(chalk.hex(GRAY)("\n  (interrupting…)\n"));
    } else {
      rl.close();
    }
  });

  while (true) {
    let query: string;
    try {
      query = (await prompt()).trim();
    } catch {
      break;
    }

    if (!query) continue;

    // Slash commands — all routed through the unified handler
    if (query.startsWith("/") || query === "exit") {
      const result = await handleSlash(query, loop);
      if (result.exit) {
        console.log(chalk.hex(GRAY)("Bye!"));
        break;
      }
      if (!result.runPrompt) continue;
      query = result.runPrompt; // /review and /init feed a prompt to the agent
    }

    console.log("");

    // Track whether we're mid-line so tool calls and text never collide.
    let textOpen = false; // currently streaming a run of assistant text
    const ensureLabel = () => {
      if (!textOpen) {
        process.stdout.write(chalk.hex(BLUE)("Elliot: "));
        textOpen = true;
      }
    };

    currentAbort = new AbortController();
    try {
      await loop.run(
        query,
        (text) => {
          ensureLabel();
          process.stdout.write(text);
        },
        (toolName, args) => {
          // Close any open text line before printing a tool action
          if (textOpen) {
            process.stdout.write("\n");
            textOpen = false;
          }
          let preview = "";
          try {
            const parsed = JSON.parse(args);
            const first = Object.values(parsed)[0];
            preview = first ? ` ${String(first).slice(0, 50)}` : "";
          } catch { /* ignore */ }
          console.log(chalk.hex(GRAY)(`  ⚙ ${toolName}${chalk.hex(CYAN)(preview)}`));
        },
        (_result) => {
          // Tool results are not shown — model uses them internally
        },
        currentAbort.signal
      );
      if (textOpen) console.log(""); // close the final text line
      console.log("");
    } catch (e) {
      // A user abort surfaces as an SDK error; it's already been reported as
      // an interrupt, so don't print a scary red error for it.
      if (currentAbort?.signal.aborted) {
        console.log("");
      } else {
        console.log("");
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error(chalk.red(`✗ ${msg}`));
        if (msg.includes("401"))
          console.log(chalk.hex(GRAY)("  Invalid key — edit ~/.elliot/config.json"));
        if (msg.includes("429"))
          console.log(chalk.hex(GRAY)("  Rate limited — wait a moment and try again"));
      }
    } finally {
      currentAbort = null;
    }
  }

  rl.close();
}
