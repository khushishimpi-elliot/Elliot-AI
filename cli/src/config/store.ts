/**
 * Config store — persisted to ~/.elliot/config.json.
 *
 * Holds the API base URL and the JWT issued by the backend after login.
 * Anything in here is a secret-ish credential, so we chmod 0600 the file.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface ElliotConfig {
  apiUrl: string;
  token?: string;
  email?: string;
  orgName?: string;
  /** ISO-8601 timestamp; for display only, server still validates */
  loggedInAt?: string;
}

const CONFIG_DIR = join(homedir(), ".elliot");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: ElliotConfig = {
  apiUrl: process.env.ELLIOT_API_URL || "https://elliot-ai-backend.onrender.com",
};

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadConfig(): ElliotConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    // Corrupted file — fall back to defaults rather than crashing
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(updates: Partial<ElliotConfig>): ElliotConfig {
  ensureDir();
  const current = loadConfig();
  const next = { ...current, ...updates };
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), { mode: 0o600 });
  try {
    chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // Windows often errors on chmod; ignore.
  }
  return next;
}

export function clearAuth(): void {
  ensureDir();
  const current = loadConfig();
  const next: ElliotConfig = { apiUrl: current.apiUrl };
  writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2), { mode: 0o600 });
}

export function isAuthenticated(cfg: ElliotConfig = loadConfig()): boolean {
  return Boolean(cfg.token);
}

export const CONFIG_PATH_FOR_DISPLAY = CONFIG_PATH;
