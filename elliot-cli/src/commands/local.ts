import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import chalk from "chalk";
import { AgentLoop } from "../agent/loop.js";
import { loadAgentContext } from "../agent/context.js";
import { undoLastTurn } from "../agent/undo.js";
import { usageCommand } from "./usage.js";

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
const YELLOW = "#F0C040";

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
      "  Type your question. /usage /undo /compact /clear /exit"
    )
  );
  console.log("");
}

export async function localCommand(): Promise<void> {
  // Validate API key is reachable (provider reads from config or env)
  const hasEnvKey = !!(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY);
  const hasConfigKey = (() => {
    try {
      const p = path.join(
        process.env.HOME || process.env.USERPROFILE || "",
        ".elliot",
        "config.json"
      );
      const cfg = JSON.parse(fs.readFileSync(p, "utf-8"));
      return !!(cfg.groq_api_key || cfg.openrouter_api_key || cfg.apiKey);
    } catch {
      return false;
    }
  })();

  if (!hasEnvKey && !hasConfigKey) {
    console.error(
      chalk.red("✗ No API key found.\n") +
        chalk.hex(GRAY)(
          "  Add GROQ_API_KEY to elliot-cli/.env, or run: elliot-ai init"
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

    // Slash commands
    if (query === "/exit" || query === "/quit" || query === "exit") {
      console.log(chalk.hex(GRAY)("Bye!"));
      break;
    }
    if (query === "/usage" || query === "/usage --week" || query === "/usage -w") {
      await usageCommand({ week: query !== "/usage" });
      continue;
    }
    if (query.startsWith("/usage --date ") || query.startsWith("/usage -d ")) {
      const date = query.split(" ").pop() ?? "";
      await usageCommand({ date });
      continue;
    }
    if (query === "/undo") {
      const msg = await undoLastTurn();
      console.log(chalk.hex(YELLOW)(msg));
      continue;
    }
    if (query === "/compact") {
      loop.compactHistory();
      console.log(chalk.hex(GRAY)("History compacted to last 20 messages."));
      continue;
    }
    if (query === "/clear") {
      loop.clearHistory();
      console.log(chalk.hex(GRAY)("History cleared."));
      continue;
    }
    if (query === "/help") {
      console.log("");
      console.log(chalk.hex(CYAN)("  Slash commands:"));
      console.log("  " + chalk.hex(YELLOW)("/usage          ") + chalk.hex(GRAY)("Show today's token usage"));
      console.log("  " + chalk.hex(YELLOW)("/usage --week   ") + chalk.hex(GRAY)("Show last 7 days"));
      console.log("  " + chalk.hex(YELLOW)("/usage --date X ") + chalk.hex(GRAY)("Show usage for YYYY-MM-DD"));
      console.log("  " + chalk.hex(YELLOW)("/undo           ") + chalk.hex(GRAY)("Revert last file changes"));
      console.log("  " + chalk.hex(YELLOW)("/compact        ") + chalk.hex(GRAY)("Trim history to last 20 messages"));
      console.log("  " + chalk.hex(YELLOW)("/clear          ") + chalk.hex(GRAY)("Clear all conversation history"));
      console.log("  " + chalk.hex(YELLOW)("/exit           ") + chalk.hex(GRAY)("Quit"));
      console.log("");
      continue;
    }

    console.log("");
    process.stdout.write(chalk.hex(BLUE)("Elliot: "));

    try {
      await loop.run(
        query,
        (text) => {
          process.stdout.write(text);
        },
        (toolName, args) => {
          let preview = "";
          try {
            const parsed = JSON.parse(args);
            const first = Object.values(parsed)[0];
            preview = first ? ` ${String(first).slice(0, 50)}` : "";
          } catch { /* ignore */ }
          process.stdout.write("\n");
          console.log(chalk.hex(CYAN)(`  ⚙ ${toolName}${preview}`));
          process.stdout.write(chalk.hex(BLUE)("Elliot: "));
        },
        (_result) => {
          // Tool results are not shown — model uses them internally
        }
      );
      console.log("\n");
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
