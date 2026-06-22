import fetch from "node-fetch";
import EventSource = require("eventsource");
import { ElliotConfig } from "./config";
import { printSources } from "./display";

export async function streamQuery(
  query: string,
  config: ElliotConfig
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
    let isFirstToken = true;

    eventSource.addEventListener("message", (event: any) => {
      try {
        const data = JSON.parse(event.data);

        if (data.token) {
          process.stdout.write(data.token);
          isFirstToken = false;
        }

        if (data.done) {
          process.stdout.write("\n");
          if (data.sources_used) {
            sourcesUsed = data.sources_used;
          }
          eventSource.close();
        }
      } catch (error) {
        eventSource.close();
      }
    });

    eventSource.addEventListener("error", (event: any) => {
      const error = event.error || event;
      if (error.status !== undefined) {
        console.error(`Error: Backend responded with ${error.status}`);
      } else {
        console.error("Error: Connection lost");
      }
      eventSource.close();
    });

    await new Promise<void>((resolve) => {
      eventSource.addEventListener("done", () => {
        printSources(sourcesUsed);
        resolve();
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Error: Failed to connect to backend");
    }
    throw error;
  }
}
