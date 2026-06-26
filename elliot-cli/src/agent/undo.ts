import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

interface Snapshot {
  path: string;
  existed: boolean;
  before: string;
}

const undoStack: Snapshot[][] = [];
let currentTurn: Snapshot[] = [];

export function beginTurn(): void {
  currentTurn = [];
}

export async function snapshot(filePath: string): Promise<void> {
  const existed = existsSync(filePath);
  const before = existed ? await readFile(filePath, "utf-8") : "";
  currentTurn.push({ path: filePath, existed, before });
}

export function commitTurn(): void {
  if (currentTurn.length > 0) {
    undoStack.push([...currentTurn]);
  }
  currentTurn = [];
}

export async function undoLastTurn(): Promise<string> {
  const turn = undoStack.pop();
  if (!turn || turn.length === 0) return "Nothing to undo.";
  for (const snap of turn) {
    if (!snap.existed) {
      await writeFile(snap.path, "", "utf-8");
    } else {
      await mkdir(path.dirname(snap.path), { recursive: true });
      await writeFile(snap.path, snap.before, "utf-8");
    }
  }
  return `Reverted ${turn.length} file change(s).`;
}

export function undoStackSize(): number {
  return undoStack.length;
}
