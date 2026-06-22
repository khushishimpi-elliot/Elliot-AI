import fetch from "node-fetch";
import { ElliotConfig } from "./config";

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

export async function getConnectorStatus(
  config: ElliotConfig
): Promise<Record<string, boolean>> {
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
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      connectors?: Record<string, { connected: boolean }>;
    };
    const connectors: Record<string, boolean> = {};

    if (data.connectors) {
      for (const [name, info] of Object.entries(data.connectors)) {
        connectors[name] = info.connected;
      }
    }

    return connectors;
  } catch {
    return {};
  }
}
