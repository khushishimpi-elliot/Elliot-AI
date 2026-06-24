/**
 * Elliot-AI Terminal API Client
 * Comprehensive API client for onboarding and query workflows
 */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Token & Tenant Management ──────────────────────────────
const getToken = () => localStorage.getItem("elliot_token");
const getTenantId = () => localStorage.getItem("elliot_tenant_id");
const setToken = (token: string) => localStorage.setItem("elliot_token", token);
const setTenantId = (id: string) => localStorage.setItem("elliot_tenant_id", id);

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Auth Endpoints ─────────────────────────────────────────

export async function sendMagicLink(email: string) {
  const res = await fetch(`${API_URL}/auth/magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function redeemMagicLink(token: string) {
  const res = await fetch(`${API_URL}/auth/callback?token=${token}`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function googleLogin() {
  window.location.href = `${API_URL}/auth/google/login`;
}

export async function entraLogin() {
  window.location.href = `${API_URL}/auth/entra/login`;
}

export async function auth0Login() {
  const res = await fetch(`${API_URL}/auth/auth0/login`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

// ── Onboarding: Workspace (Step 2) ─────────────────────────

export async function createWorkspace(data: {
  name: string;
  domain: string;
  team_size?: string;
  residency?: string;
}) {
  const res = await fetch(`${API_URL}/onboarding/workspace`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  const result = await res.json();
  setTenantId(result.tenant_id);
  return result;
}

// ── Onboarding: SDLC Profile (Step 3) ──────────────────────

export async function saveSdlcProfile(data: {
  stack?: string;
  branching_model?: string;
  test_framework?: string;
  coverage_gate?: number;
  ci_cd_platform?: string;
  review_policy?: string;
  arch_style?: string;
}) {
  const tenantId = getTenantId();
  if (!tenantId) throw new Error("No tenant ID");

  const res = await fetch(`${API_URL}/onboarding/sdlc`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      tenant_id: tenantId,
      ...data,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Connectors (Step 4) ────────────────────────────────────

export async function listConnectors() {
  const tenantId = getTenantId();
  if (!tenantId) return [];

  const res = await fetch(`${API_URL}/connectors/${tenantId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getConnectorAuthUrl(provider: string) {
  const tenantId = getTenantId();
  if (!tenantId) throw new Error("No tenant ID");

  const res = await fetch(
    `${API_URL}/connectors/${tenantId}/${provider}/authorize`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Index Stats (Step 5) ───────────────────────────────────

export async function getIndexStats() {
  const tenantId = getTenantId();
  if (!tenantId) throw new Error("No tenant ID");

  const res = await fetch(`${API_URL}/index/${tenantId}/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Launch Summary (Step 6) ────────────────────────────────

export interface LaunchSummary {
  org_name: string;
  primary_stack: string;
  arch_style: string;
  compliance: string[];
  connectors: { name: string; status: "connected" | "not_connected" }[];
  indexed_chunks: number;
}

const MOCK_LAUNCH_SUMMARY: LaunchSummary = {
  org_name: "Elliot Systems",
  primary_stack: "Python 3.11 + FastAPI + React + Vite",
  arch_style: "Hexagonal",
  compliance: ["SOC 2", "PCI-DSS"],
  connectors: [
    { name: "GitHub", status: "connected" },
    { name: "Jira", status: "connected" },
    { name: "Slack", status: "connected" },
    { name: "Confluence", status: "not_connected" },
  ],
  indexed_chunks: 542_000,
};

export async function getLaunchSummary(mock = false): Promise<LaunchSummary> {
  if (mock) return MOCK_LAUNCH_SUMMARY;

  const tenantId = getTenantId();
  if (!tenantId) return MOCK_LAUNCH_SUMMARY;

  try {
    const res = await fetch(`${API_URL}/launch`, {
      headers: authHeaders(),
    });
    if (!res.ok) return MOCK_LAUNCH_SUMMARY;
    return res.json();
  } catch {
    return MOCK_LAUNCH_SUMMARY;
  }
}

// Legacy function signature for backward compatibility
export async function fetchLaunchSummary(opts: {
  token?: string;
  baseUrl?: string;
  mock?: boolean;
}): Promise<LaunchSummary> {
  if (opts.mock) return MOCK_LAUNCH_SUMMARY;

  const url = `${opts.baseUrl ?? API_URL}/launch`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`launch summary fetch failed: ${resp.status}`);
  }
  return (await resp.json()) as LaunchSummary;
}

// ── Query & Streaming ──────────────────────────────────────

export interface QueryRequest {
  query: string;
  tenant_id: string;
  user_id: string;
  team_id?: string;
  repo?: string;
  branch?: string;
}

export async function queryStream(
  request: QueryRequest,
  onToken: (token: string) => void,
  onMetadata?: (metadata: any) => void,
  onError?: (error: string) => void
) {
  const res = await fetch(`${API_URL}/query/stream`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.text();
    onError?.(error);
    throw new Error(error);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      buffer = lines[lines.length - 1];

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if (data.token) {
            onToken(data.token);
          }

          if (data.done) {
            onMetadata?.(data);
          }

          if (data.error) {
            onError?.(data.error);
          }
        } catch (e) {
          console.warn("Failed to parse SSE event:", line);
        }
      }
    }

    // Final flush
    if (buffer.trim().startsWith("data: ")) {
      try {
        const data = JSON.parse(buffer.slice(6));
        if (data.token) onToken(data.token);
        if (data.done) onMetadata?.(data);
        if (data.error) onError?.(data.error);
      } catch (e) {
        console.warn("Failed to parse final SSE event:", buffer);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function query(request: QueryRequest) {
  const res = await fetch(`${API_URL}/query/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Usage Stats ────────────────────────────────────────────

export async function getUsageSummary() {
  const tenantId = getTenantId();
  if (!tenantId) return null;

  try {
    const res = await fetch(`${API_URL}/usage/summary/${tenantId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getTenantUsage() {
  const tenantId = getTenantId();
  if (!tenantId) return null;

  try {
    const res = await fetch(`${API_URL}/usage/tenant/${tenantId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Teams ──────────────────────────────────────────────────

export async function getTeams() {
  const tenantId = getTenantId();
  if (!tenantId) return [];

  try {
    const res = await fetch(
      `${API_URL}/teams?tenant_id=${tenantId}`,
      { headers: authHeaders() }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
