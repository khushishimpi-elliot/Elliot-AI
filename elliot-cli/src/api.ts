import fetch from "node-fetch";
import { ElliotConfig } from "./config.js";

export async function checkBackendHealth(
  backendUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(`${backendUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export interface ConnectorInfo {
  provider: string;
  status: "connected" | "not_connected";
}

export async function getConnectorStatus(
  config: ElliotConfig
): Promise<ConnectorInfo[]> {
  try {
    const response = await fetch(
      `${config.backend_url}/connectors/${config.tenant_id}`,
      {
        headers: {
          Authorization: `Bearer ${config.jwt_token}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      connectors?: Record<string, { connected: boolean }>;
    };
    const connectors: ConnectorInfo[] = [];

    if (data.connectors) {
      for (const [name, info] of Object.entries(data.connectors)) {
        connectors.push({
          provider: name,
          status: info.connected ? "connected" : "not_connected",
        });
      }
    }

    return connectors;
  } catch {
    return [];
  }
}

export interface IndexStats {
  total_chunks: number;
}

export async function getIndexStats(
  config: ElliotConfig
): Promise<IndexStats> {
  try {
    const response = await fetch(
      `${config.backend_url}/index/${config.tenant_id}/stats`,
      {
        headers: {
          Authorization: `Bearer ${config.jwt_token}`,
        },
      }
    );

    if (!response.ok) {
      return { total_chunks: 0 };
    }

    const data = (await response.json()) as IndexStats;
    return data;
  } catch {
    return { total_chunks: 0 };
  }
}
