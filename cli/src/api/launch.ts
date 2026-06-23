import { request } from "./client.js";

export interface LaunchSummary {
  org_name: string;
  primary_stack?: string;
  arch_style?: string;
  compliance?: string[];
  connectors?: { name: string; status: "connected" | "not_connected" }[];
  indexed_chunks?: number;
}

export async function getLaunchSummary(): Promise<LaunchSummary> {
  return request<LaunchSummary>("/launch");
}
