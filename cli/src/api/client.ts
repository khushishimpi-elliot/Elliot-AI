/**
 * Thin fetch wrapper that injects the bearer token and a useful UA.
 *
 * Every API call routes through `request` so retries, error formatting and
 * timeouts can be added in one place later.
 */
import { loadConfig } from "../config/store.js";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(`HTTP ${status}: ${message}`);
    this.name = "ApiError";
  }
}

export async function request<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const cfg = loadConfig();
  const url = `${cfg.apiUrl.replace(/\/$/, "")}${path}`;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (cfg.token) {
    headers.set("Authorization", `Bearer ${cfg.token}`);
  }
  headers.set("User-Agent", "elliot-cli/0.1");

  const resp = await fetch(url, { ...init, headers });
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.text();
      detail = body || detail;
    } catch {
      /* swallow */
    }
    throw new ApiError(resp.status, detail.slice(0, 200));
  }

  if (resp.status === 204) return undefined as T;

  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) return (await resp.json()) as T;
  return (await resp.text()) as unknown as T;
}

/** Probe `/health`. Returns true if the backend responds. */
export async function ping(): Promise<boolean> {
  try {
    await request("/health");
    return true;
  } catch {
    return false;
  }
}
