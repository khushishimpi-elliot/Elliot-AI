import chalk from "chalk";
import { ElliotConfig } from "./config.js";

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

export function printError(message: string): void {
  console.error(chalk.hex(RED)(`✗ ${message}`));
}

export function printSuccess(message: string): void {
  console.log(chalk.hex(GREEN)(`✅ ${message}`));
}

export function printInfo(message: string): void {
  console.log(chalk.hex(WHITE)(message));
}
