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

function printBanner(): void {
  console.log("");
  console.log(chalk.hex(GREEN)("┌─────────────────────────────────────┐"));
  console.log(
    chalk.hex(GREEN)("│") +
      "  ELLIOT-AI  " +
      chalk.hex(GRAY)("local mode") +
      "               " +
      chalk.hex(GREEN)("│")
  );
  console.log(
    chalk.hex(GREEN)("│") +
      chalk.hex(GRAY)(`  ${process.cwd()}`.substring(0, 35).padEnd(35)) +
      "  " +
      chalk.hex(GREEN)("│")
  );
  console.log(chalk.hex(GREEN)("└─────────────────────────────────────┘"));
  console.log(
    chalk.hex(GRAY)(
      "  Type your question, or /help for commands."
    )
  );
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
        const preview = JSON.stringify(input, null, 2).slice(0, 300);
        rl.question(
          chalk.hex(CYAN)(`\n  permission → ${name}\n`) +
            chalk.hex(GRAY)(preview) +
            chalk.hex(GREEN)("\n  Allow? [y/N] "),
          (answer) => resolve(answer.trim().toLowerCase() === "y")
        );
      })
  );

  rl.on("close", () => {
    console.log(chalk.hex(GRAY)("\nBye!"));
    process.exit(0);
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
        }
      );
      if (textOpen) console.log(""); // close the final text line
      console.log("");
    } catch (e) {
      console.log("");
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error(chalk.red(`✗ ${msg}`));
      if (msg.includes("401"))
        console.log(chalk.hex(GRAY)("  Invalid key — edit ~/.elliot/config.json"));
      if (msg.includes("429"))
        console.log(chalk.hex(GRAY)("  Rate limited — wait a moment and try again"));
    }
  }

  rl.close();
}
