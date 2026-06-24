/**
 * Elliot-AI Dashboard API Client
 * API client for dashboard analytics and team management
 */

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Token & Tenant Management ──────────────────────────────
const getToken = () => localStorage.getItem("elliot_token");
const getTenantId = () =>
  localStorage.getItem("elliot_tenant_id") ||
  "00000000-0000-0000-0000-000000000001";
const setToken = (token: string) => localStorage.setItem("elliot_token", token);
const setTenantId = (id: string) => localStorage.setItem("elliot_tenant_id", id);

const authHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Usage Analytics ────────────────────────────────────────

export interface UsageSummary {
  total_queries: number;
  total_tokens: number;
  total_cost: number;
  period: string;
}

export async function getUsageSummary(): Promise<UsageSummary | null> {
  const tenantId = getTenantId();
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

export interface TenantUsage {
  tenant_id: string;
  total_queries: number;
  total_tokens: number;
  average_token_cost: number;
  queries_this_month: number;
  top_query_types: Array<{ type: string; count: number }>;
}

export async function getTenantUsage(): Promise<TenantUsage | null> {
  const tenantId = getTenantId();
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

// ── Teams Management ───────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  members_count: number;
  role: string;
}

export async function getTeams(): Promise<Team[]> {
  const tenantId = getTenantId();
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

// ── Connectors Management ──────────────────────────────────

export interface Connector {
  id: string;
  provider: string;
  status: "connected" | "disconnected" | "error";
  last_sync?: string;
  error_message?: string;
}

export async function listConnectors(): Promise<Connector[]> {
  const tenantId = getTenantId();
  try {
    const res = await fetch(`${API_URL}/connectors/${tenantId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getConnectorAuthUrl(provider: string) {
  const tenantId = getTenantId();
  try {
    const res = await fetch(
      `${API_URL}/connectors/${tenantId}/${provider}/authorize`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error("Failed to get auth URL");
    return res.json();
  } catch (error) {
    throw new Error(`Failed to authorize ${provider}: ${error}`);
  }
}

// ── Organization Info ──────────────────────────────────────

export interface OrganisationInfo {
  id: string;
  name: string;
  domain: string;
  team_size: string;
  data_residency: string;
  created_at: string;
}

export async function getOrganisationInfo(): Promise<OrganisationInfo | null> {
  const tenantId = getTenantId();
  try {
    const res = await fetch(`${API_URL}/organisations/${tenantId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Health Check ───────────────────────────────────────────

export async function healthCheck() {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

// ── Auth ───────────────────────────────────────────────────

export async function googleLogin() {
  window.location.href = `${API_URL}/auth/google/login`;
}

export async function entraLogin() {
  window.location.href = `${API_URL}/auth/entra/login`;
}

export async function logout() {
  localStorage.removeItem("elliot_token");
  localStorage.removeItem("elliot_tenant_id");
  window.location.href = "/";
}
