/**
 * Minimal API client for the launch summary.
 *
 * Backend endpoint is task #27 (Astika). Until that lands, callers can
 * pass `{ mock: true }` to skip the network call and get a stable
 * placeholder response. The shape mirrors PDF page 3 step 6.
 */

export interface LaunchSummary {
  org_name: string;
  primary_stack: string;
  arch_style: string;
  compliance: string[]; // e.g. ["SOC 2", "PCI-DSS"]
  connectors: { name: string; status: "connected" | "not_connected" }[];
  indexed_chunks: number;
}

const MOCK_SUMMARY: LaunchSummary = {
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

export async function fetchLaunchSummary(opts: {
  token?: string;
  baseUrl?: string;
  mock?: boolean;
}): Promise<LaunchSummary> {
  if (opts.mock) return MOCK_SUMMARY;

  const url = `${opts.baseUrl ?? ""}/launch`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`launch summary fetch failed: ${resp.status}`);
  }
  return (await resp.json()) as LaunchSummary;
}
