import { request } from "./client.js";

export interface QueryResponse {
  answer: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  sources?: { source: string; score: number }[];
}

/**
 * Single-shot query. Calls backend's /query endpoint.
 *
 * Streaming variant (SSE) is a follow-up — for v0.1 the CLI shows a spinner
 * and reveals the answer when the call resolves.
 */
export async function ask(query: string): Promise<QueryResponse> {
  return request<QueryResponse>("/query", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}
