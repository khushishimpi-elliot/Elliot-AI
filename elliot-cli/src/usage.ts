import { appendFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import path from "path";

export interface UsageEntry {
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  command: "local" | "ask";
  model: string;
  input_tokens: number;
  output_tokens: number;
  query_preview: string;
}

function getUsagePath(): string {
  const dir = path.join(homedir(), ".elliot");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return path.join(dir, "usage.jsonl");
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function timeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function logUsage(entry: Omit<UsageEntry, "date" | "time">): void {
  try {
    const record: UsageEntry = { date: todayStr(), time: timeStr(), ...entry };
    appendFileSync(getUsagePath(), JSON.stringify(record) + "\n", "utf-8");
  } catch {
    // Never crash the main flow for a logging failure
  }
}

export interface DaySummary {
  date: string;
  queries: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  by_model: Record<string, { queries: number; input: number; output: number }>;
  by_command: Record<string, number>;
  entries: UsageEntry[];
}

export function readUsageForDate(date: string): DaySummary {
  const summary: DaySummary = {
    date,
    queries: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_tokens: 0,
    by_model: {},
    by_command: {},
    entries: [],
  };

  const filePath = getUsagePath();
  if (!existsSync(filePath)) return summary;

  const lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const entry: UsageEntry = JSON.parse(line);
      if (entry.date !== date) continue;

      summary.queries++;
      summary.total_input_tokens += entry.input_tokens;
      summary.total_output_tokens += entry.output_tokens;
      summary.total_tokens += entry.input_tokens + entry.output_tokens;
      summary.entries.push(entry);

      if (!summary.by_model[entry.model]) {
        summary.by_model[entry.model] = { queries: 0, input: 0, output: 0 };
      }
      summary.by_model[entry.model].queries++;
      summary.by_model[entry.model].input += entry.input_tokens;
      summary.by_model[entry.model].output += entry.output_tokens;

      summary.by_command[entry.command] = (summary.by_command[entry.command] ?? 0) + 1;
    } catch {
      // skip malformed lines
    }
  }

  return summary;
}

export function readAllDates(): string[] {
  const filePath = getUsagePath();
  if (!existsSync(filePath)) return [];

  const seen = new Set<string>();
  const lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const entry: UsageEntry = JSON.parse(line);
      seen.add(entry.date);
    } catch {
      // skip
    }
  }
  return [...seen].sort().reverse();
}
