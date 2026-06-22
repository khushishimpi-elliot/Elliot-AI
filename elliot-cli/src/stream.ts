import fetch from "node-fetch";
import EventSource from "eventsource";
import { ElliotConfig } from "./config.js";

export async function streamQuery(
  query: string,
  config: ElliotConfig,
  onToken: (token: string) => void,
  onDone: (sources: Record<string, number>) => void,
  onError: (error: string) => void
): Promise<void> {
  const url = `${config.backend_url}/query/stream`;
  const headers = {
    Authorization: `Bearer ${config.jwt_token}`,
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({
    query,
    tenant_id: config.tenant_id,
    user_id: config.user_id,
    team_id: config.team_id,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(
        `Backend error: ${response.status} ${response.statusText}`
      );
    }

    const eventSource = new EventSource(url, {
      method: "POST",
      headers,
      body,
    } as any);

    let sourcesUsed: Record<string, number> = {};

    eventSource.addEventListener("message", (event: any) => {
      try {
        const data = JSON.parse(event.data);

        if (data.token) {
          onToken(data.token);
        }

        if (data.done) {
          if (data.sources_used) {
            sourcesUsed = data.sources_used;
          }
          eventSource.close();
          onDone(sourcesUsed);
        }
      } catch (error) {
        eventSource.close();
      }
    });

    eventSource.addEventListener("error", (event: any) => {
      eventSource.close();
      onError("Connection lost or backend error");
    });
  } catch (error) {
    if (error instanceof Error) {
      onError(error.message);
    } else {
      onError("Failed to connect to backend");
    }
  }
}
