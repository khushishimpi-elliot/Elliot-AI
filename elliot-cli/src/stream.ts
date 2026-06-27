import fetch from "node-fetch";
import { ElliotConfig } from "./config.js";
import { logUsage } from "./usage.js";

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
      if (response.status === 401) {
        throw new Error(
          "Authentication failed. Run 'elliot-ai init' to reconfigure."
        );
      }
      if (response.status === 404) {
        throw new Error(
          "Backend endpoint not found. Check your backend configuration."
        );
      }
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const reader = (response as any).body.getReader();
    const decoder = new TextDecoder();
    let sourcesUsed: Record<string, number> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice(6));

          if (data.token) {
            onToken(data.token);
          }

          if (data.done) {
            if (data.sources_used) {
              sourcesUsed = data.sources_used;
            }
            logUsage({
              command: "ask",
              model: data.tokens?.model ?? "claude-sonnet-4-6",
              input_tokens: data.tokens?.input ?? 0,
              output_tokens: data.tokens?.output ?? 0,
              query_preview: query.slice(0, 80),
            });
            onDone(sourcesUsed);
            return;
          }

          if (data.error) {
            onError(data.error);
            return;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      onError(error.message);
    } else {
      onError("Failed to connect to backend");
    }
  }
}
