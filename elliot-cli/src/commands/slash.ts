import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import chalk from "chalk";
import type { AgentLoop } from "../agent/loop.js";
import { undoLastTurn } from "../agent/undo.js";
import {
  getProviderStatus,
  activeProviderName,
  setModelOverride,
} from "../agent/provider.js";

const execAsync = promisify(exec);

const GREEN = "#4FFFB0";
const GRAY = "#888888";
const CYAN = "#79C0FF";
const YELLOW = "#F0C040";

export interface SlashResult {
  handled: boolean;
  exit?: boolean;
  runPrompt?: string; // if set, the REPL runs the agent with this prompt
}

const CONTEXT_WINDOW = 128_000; // approx token budget we warn against

const HELP = [
  ["/help", "Show this command list"],
  ["/model [name]", "Show or switch the model"],
  ["/status", "Show provider, model, and working directory"],
  ["/context", "Show context (token) usage this session"],
  ["/cost", "Show estimated tokens used this session"],
  ["/cd <path>", "Change the working directory"],
  ["/diff", "Show uncommitted git changes"],
  ["/review", "Review the current git diff"],
  ["/init", "Generate AGENT.md for this project"],
  ["/copy", "Copy Elliot's last response to clipboard"],
  ["/export [file]", "Save the conversation to a text file"],
  ["/compact", "Trim history to free up context"],
  ["/clear", "Wipe the conversation history"],
  ["/undo", "Revert the last file change"],
  ["/exit", "Quit (aliases: /quit, exit)"],
];

async function copyToClipboard(text: string): Promise<boolean> {
  const platform = process.platform;
  const cmd =
    platform === "win32" ? "clip" :
    platform === "darwin" ? "pbcopy" :
    "xclip -selection clipboard";
  try {
    await new Promise<void>((resolve, reject) => {
      const child = exec(cmd, (err) => (err ? reject(err) : resolve()));
      child.stdin?.end(text);
    });
    return true;
  } catch {
    return false;
  }
}

export async function handleSlash(
  input: string,
  loop: AgentLoop
): Promise<SlashResult> {
  if (!input.startsWith("/") && input !== "exit") return { handled: false };

  const [cmd, ...rest] = input.split(/\s+/);
  const arg = rest.join(" ").trim();

  switch (cmd) {
    case "/exit":
    case "/quit":
    case "exit":
      return { handled: true, exit: true };

    case "/help": {
      console.log("");
      for (const [c, desc] of HELP) {
        console.log("  " + chalk.hex(GREEN)(c.padEnd(16)) + chalk.hex(GRAY)(desc));
      }
      console.log("");
      return { handled: true };
    }

    case "/model": {
      const providers = getProviderStatus().filter((p) => p.hasKey);
      if (!arg) {
        console.log(chalk.hex(GRAY)("\nAvailable models (active provider first):"));
        for (const p of providers) {
          console.log("  " + chalk.hex(CYAN)(p.name));
          for (const m of p.models) console.log("    " + chalk.hex(GRAY)(m));
        }
        console.log(chalk.hex(GRAY)("\nUse: /model <name>\n"));
        return { handled: true };
      }
      const exists = providers.some((p) => p.models.includes(arg));
      if (!exists) {
        console.log(chalk.red(`Unknown model "${arg}". Run /model to see options.`));
        return { handled: true };
      }
      setModelOverride(arg);
      console.log(chalk.hex(GREEN)(`Model pinned to ${arg}.`));
      return { handled: true };
    }

    case "/status": {
      console.log("");
      console.log("  " + chalk.hex(GRAY)("directory  ") + process.cwd());
      console.log("  " + chalk.hex(GRAY)("provider   ") + activeProviderName());
      for (const p of getProviderStatus()) {
        const mark = p.hasKey ? chalk.hex(GREEN)("✓") : chalk.hex(GRAY)("✗");
        console.log("  " + chalk.hex(GRAY)("           ") + `${mark} ${p.name}`);
      }
      console.log("  " + chalk.hex(GRAY)("messages   ") + loop.messageCount());
      console.log("");
      return { handled: true };
    }

    case "/context":
    case "/cost": {
      const tokens = loop.estimatedTokens();
      const pct = Math.min(100, Math.round((tokens / CONTEXT_WINDOW) * 100));
      const bar = "█".repeat(Math.round(pct / 5)).padEnd(20, "░");
      console.log("");
      console.log("  " + chalk.hex(CYAN)(bar) + `  ${pct}%`);
      console.log("  " + chalk.hex(GRAY)(`~${tokens.toLocaleString()} tokens of ~${CONTEXT_WINDOW.toLocaleString()} (estimated)`));
      if (pct > 70) console.log("  " + chalk.hex(YELLOW)("Context getting full — consider /compact"));
      console.log("");
      return { handled: true };
    }

    case "/cd": {
      if (!arg) {
        console.log(chalk.hex(GRAY)("Usage: /cd <path>"));
        return { handled: true };
      }
      const target = path.resolve(process.cwd(), arg);
      try {
        process.chdir(target);
        console.log(chalk.hex(GREEN)(`Now in ${process.cwd()}`));
      } catch {
        console.log(chalk.red(`Cannot cd to "${arg}" — no such directory.`));
      }
      return { handled: true };
    }

    case "/diff": {
      try {
        const { stdout } = await execAsync("git diff --stat && echo --- && git diff", {
          cwd: process.cwd(),
          maxBuffer: 5 * 1024 * 1024,
        });
        console.log("\n" + (stdout.trim() || chalk.hex(GRAY)("No uncommitted changes.")) + "\n");
      } catch {
        console.log(chalk.red("Not a git repository (or git not installed)."));
      }
      return { handled: true };
    }

    case "/review":
      return {
        handled: true,
        runPrompt:
          "Run 'git diff' to see my uncommitted changes, then review them for bugs, " +
          "edge cases, and quality issues. Be specific with file names and line context.",
      };

    case "/init":
      return {
        handled: true,
        runPrompt:
          "Analyze this project and create an AGENT.md file (use the write tool) with: " +
          "1) what the project does, 2) tech stack, 3) key directories, " +
          "4) how to run/test/build, 5) coding conventions. Keep it under 400 words.",
      };

    case "/copy": {
      const text = loop.lastResponseText();
      if (!text) {
        console.log(chalk.hex(GRAY)("Nothing to copy yet."));
        return { handled: true };
      }
      const ok = await copyToClipboard(text);
      console.log(
        ok
          ? chalk.hex(GREEN)("Copied last response to clipboard.")
          : chalk.red("Could not access clipboard on this system.")
      );
      return { handled: true };
    }

    case "/export": {
      const text = loop.exportText();
      if (!text) {
        console.log(chalk.hex(GRAY)("Nothing to export yet."));
        return { handled: true };
      }
      const file = arg || "elliot-conversation.txt";
      try {
        fs.writeFileSync(path.resolve(process.cwd(), file), text, "utf-8");
        console.log(chalk.hex(GREEN)(`Conversation saved to ${file}`));
      } catch (e) {
        console.log(chalk.red(`Could not write ${file}: ${(e as Error).message}`));
      }
      return { handled: true };
    }

    case "/compact":
      loop.compactHistory();
      console.log(chalk.hex(GRAY)("History compacted to last 20 messages."));
      return { handled: true };

    case "/clear":
      loop.clearHistory();
      console.log(chalk.hex(GRAY)("History cleared."));
      return { handled: true };

    case "/undo": {
      const msg = await undoLastTurn();
      console.log(chalk.hex(YELLOW)(msg));
      return { handled: true };
    }

    default:
      console.log(chalk.hex(GRAY)(`Unknown command ${cmd}. Type /help for the list.`));
      return { handled: true };
  }
}
