import { useState, useEffect } from "react";

export interface ConnectorStatus {
  id: string;
  provider: string;
  status: "connected" | "not_connected";
  last_synced: string | null;
  scopes: string[];
}

const MOCK_CONNECTORS: ConnectorStatus[] = [
  { id: "c1000000-0000-0000-0000-000000000001", provider: "github", status: "connected", last_synced: "2026-06-17T14:30:00Z", scopes: ["repo", "read:org"] },
  { id: "c1000000-0000-0000-0000-000000000002", provider: "jira", status: "connected", last_synced: "2026-06-17T12:00:00Z", scopes: ["read:jira-work"] },
  { id: "c1000000-0000-0000-0000-000000000003", provider: "clickup", status: "connected", last_synced: "2026-06-16T09:00:00Z", scopes: ["task:read"] },
  { id: "c1000000-0000-0000-0000-000000000004", provider: "slack", status: "not_connected", last_synced: null, scopes: [] },
  { id: "c1000000-0000-0000-0000-000000000005", provider: "gitlab", status: "not_connected", last_synced: null, scopes: [] },
  { id: "c1000000-0000-0000-0000-000000000006", provider: "bitbucket", status: "not_connected", last_synced: null, scopes: [] },
  { id: "c1000000-0000-0000-0000-000000000007", provider: "linear", status: "not_connected", last_synced: null, scopes: [] },
];

export function useConnectors(tenantId: string) {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("elliot_token");
        const response = await fetch(`${apiUrl}/connectors/${tenantId}`, {
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (response.ok) { setConnectors(await response.json()); setError(null); }
        else { setConnectors(MOCK_CONNECTORS); setError("Using demo data"); }
      } catch { setConnectors(MOCK_CONNECTORS); setError("Using demo data"); }
      finally { setLoading(false); }
    };
    if (tenantId) fetchData();
  }, [tenantId]);

  return { connectors, loading, error };
}
