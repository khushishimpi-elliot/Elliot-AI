import chalk from "chalk";
import oraModule from "ora";
import { ElliotConfig } from "./config";

const GREEN = "#4FFFB0";
const GRAY = "#AAAAAA";
const WHITE = "#FFFFFF";
const RED = "#FF6B6B";

export function printWelcome(): void {
  console.log("");
  console.log("┌─────────────────────────────┐");
  console.log("│  ELLIOT-AI                  │");
  console.log("│  AI Coding Assistant        │");
  console.log("│  Elliot Systems             │");
  console.log("└─────────────────────────────┘");
  console.log("");
}

export function printQuery(query: string): void {
  console.log(chalk.hex(GREEN)(`$ elliot ask "${query}"`));
  console.log("");
}

export function printThinking(): ReturnType<typeof oraModule> {
  const spinner = oraModule({
    text: chalk.hex(GRAY)("▋ thinking..."),
    spinner: "dots",
  }).start();
  return spinner;
}

export function printResponse(text: string): void {
  process.stdout.write(chalk.hex(WHITE)(text));
}

export function printSources(sources: Record<string, number>): void {
  if (!sources || Object.keys(sources).length === 0) {
    console.log(chalk.hex(GRAY)("─────────────────────────────"));
    console.log(chalk.hex(GRAY)("Sources: none"));
    return;
  }

  const sourceStr = Object.entries(sources)
    .map(([key, count]) => `${key} (${count})`)
    .join(" · ");

  console.log(chalk.hex(GRAY)("─────────────────────────────"));
  console.log(chalk.hex(GRAY)(`Sources: ${sourceStr}`));
  console.log("");
}

export function printError(message: string): void {
  console.error(chalk.hex(RED)(`✗ ${message}`));
}

export function printStatus(config: ElliotConfig): void {
  console.log("");
  console.log(chalk.hex(GREEN)("✅ Connected to " + config.org_name));
  console.log(chalk.hex(WHITE)(`Stack: ${config.stack}`));
  console.log(chalk.hex(WHITE)(`Backend: ${config.backend_url}`));
  console.log("");
}

export function printSuccess(message: string): void {
  console.log(chalk.hex(GREEN)(`✅ ${message}`));
}

export function printInfo(message: string): void {
  console.log(chalk.hex(WHITE)(message));
}
