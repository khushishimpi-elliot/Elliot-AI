import chalk from "chalk";
import { readUsageForDate, readAllDates } from "../usage.js";

const CYAN   = "#79C0FF";
const GREEN  = "#4FFFB0";
const YELLOW = "#F0C040";
const GRAY   = "#888888";
const WHITE  = "#E6EDF3";
const DIM    = "#555555";

function bar(value: number, max: number, width = 20): string {
  if (max === 0) return chalk.hex(DIM)("─".repeat(width));
  const filled = Math.round((value / max) * width);
  return chalk.hex(GREEN)("█".repeat(filled)) + chalk.hex(DIM)("░".repeat(width - filled));
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function usageCommand(options: { date?: string; week?: boolean; all?: boolean }): Promise<void> {
  if (options.week) {
    printWeek();
    return;
  }

  const date = options.date ?? todayStr();
  printDay(date, date === todayStr());
}

function printDay(date: string, isToday: boolean): void {
  const summary = readUsageForDate(date);
  const label = isToday ? "Today" : date;

  console.log("");
  console.log(
    chalk.hex(GREEN)("┌─────────────────────────────────────────────┐")
  );
  console.log(
    chalk.hex(GREEN)("│") +
    chalk.hex(WHITE).bold(`  Elliot-AI Usage  `) +
    chalk.hex(GRAY)(`${label}`) +
    " ".repeat(Math.max(0, 27 - label.length)) +
    chalk.hex(GREEN)("│")
  );
  console.log(
    chalk.hex(GREEN)("└─────────────────────────────────────────────┘")
  );
  console.log("");

  if (summary.queries === 0) {
    console.log(chalk.hex(GRAY)(`  No usage recorded for ${date}.`));
    console.log("");
    return;
  }

  // ── Top stats ────────────────────────────────────────
  const cols = [
    { label: "Queries",       value: fmtNum(summary.queries) },
    { label: "Input tokens",  value: fmtNum(summary.total_input_tokens) },
    { label: "Output tokens", value: fmtNum(summary.total_output_tokens) },
    { label: "Total tokens",  value: fmtNum(summary.total_tokens) },
  ];

  for (const col of cols) {
    console.log(
      "  " +
      chalk.hex(GRAY)(col.label.padEnd(16)) +
      chalk.hex(CYAN).bold(col.value)
    );
  }

  // ── By command ───────────────────────────────────────
  if (Object.keys(summary.by_command).length > 0) {
    console.log("");
    console.log(chalk.hex(GRAY)("  ── By command ──────────────────────────────"));
    const maxQ = Math.max(...Object.values(summary.by_command));
    for (const [cmd, count] of Object.entries(summary.by_command)) {
      console.log(
        "  " +
        chalk.hex(YELLOW)((`elliot-ai ${cmd}`).padEnd(16)) +
        bar(count, maxQ, 16) +
        "  " +
        chalk.hex(WHITE)(fmtNum(count)) +
        chalk.hex(GRAY)(" queries")
      );
    }
  }

  // ── By model ─────────────────────────────────────────
  if (Object.keys(summary.by_model).length > 0) {
    console.log("");
    console.log(chalk.hex(GRAY)("  ── By model ───────────────────────────────"));
    const maxT = Math.max(...Object.values(summary.by_model).map((m) => m.input + m.output));
    for (const [model, data] of Object.entries(summary.by_model)) {
      const total = data.input + data.output;
      const shortModel = model.split("/").pop() ?? model;
      console.log(
        "  " +
        chalk.hex(CYAN)(shortModel.slice(0, 28).padEnd(28)) +
        bar(total, maxT, 12) +
        "  " +
        chalk.hex(WHITE)(fmtNum(total)) +
        chalk.hex(GRAY)(" tokens")
      );
    }
  }

  // ── Recent queries ───────────────────────────────────
  const recent = summary.entries.slice(-8).reverse();
  if (recent.length > 0) {
    console.log("");
    console.log(chalk.hex(GRAY)("  ── Recent queries ─────────────────────────"));
    for (const entry of recent) {
      const tokens = entry.input_tokens + entry.output_tokens;
      console.log(
        "  " +
        chalk.hex(DIM)(entry.time) +
        "  " +
        chalk.hex(GRAY)((`[${entry.command}]`).padEnd(8)) +
        chalk.hex(WHITE)(entry.query_preview.slice(0, 38).padEnd(40)) +
        chalk.hex(DIM)(fmtNum(tokens) + " tok")
      );
    }
  }

  console.log("");
}

function printWeek(): void {
  const allDates = readAllDates().slice(0, 7);

  if (allDates.length === 0) {
    console.log(chalk.hex(GRAY)("\n  No usage recorded yet.\n"));
    return;
  }

  console.log("");
  console.log(chalk.hex(GREEN).bold("  Elliot-AI — Last 7 Days"));
  console.log(chalk.hex(DIM)("  " + "─".repeat(52)));
  console.log(
    "  " +
    chalk.hex(GRAY)("Date".padEnd(14)) +
    chalk.hex(GRAY)("Queries".padEnd(10)) +
    chalk.hex(GRAY)("Tokens".padEnd(12)) +
    chalk.hex(GRAY)("Breakdown")
  );
  console.log(chalk.hex(DIM)("  " + "─".repeat(52)));

  const summaries = allDates.map((d) => readUsageForDate(d));
  const maxTokens = Math.max(...summaries.map((s) => s.total_tokens), 1);

  for (const s of summaries) {
    const isToday = s.date === todayStr();
    const dateLabel = isToday ? chalk.hex(GREEN)(s.date + " (today)") : chalk.hex(WHITE)(s.date);
    console.log(
      "  " +
      dateLabel.padEnd(isToday ? 28 : 22) +
      chalk.hex(CYAN)(fmtNum(s.queries).padEnd(10)) +
      chalk.hex(YELLOW)(fmtNum(s.total_tokens).padEnd(12)) +
      bar(s.total_tokens, maxTokens, 14)
    );
  }

  const totalQ = summaries.reduce((a, s) => a + s.queries, 0);
  const totalT = summaries.reduce((a, s) => a + s.total_tokens, 0);

  console.log(chalk.hex(DIM)("  " + "─".repeat(52)));
  console.log(
    "  " +
    chalk.hex(GRAY)("Total".padEnd(22)) +
    chalk.hex(CYAN)(fmtNum(totalQ).padEnd(10)) +
    chalk.hex(YELLOW)(fmtNum(totalT))
  );
  console.log("");
}
