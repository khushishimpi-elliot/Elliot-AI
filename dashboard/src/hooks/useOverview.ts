import { useState, useEffect } from "react";

interface OrgSummary {
  name: string;
  domain: string;
  team_size: string | null;
  residency: string;
}

interface SDLCSummary {
  stack: string | null;
  branching_model: string | null;
  test_framework: string | null;
  coverage_gate: number | null;
  ci_cd_platform: string | null;
  review_policy: string | null;
  arch_style: string | null;
}

export interface LaunchSummary {
  org: OrgSummary;
  sdlc: SDLCSummary | null;
  connectors: string[];
  chunk_count: number;
}

const MOCK_LAUNCH: LaunchSummary = {
  org: {
    name: "Elliot Systems",
    domain: "elliotsystems.com",
    team_size: "12",
    residency: "US",
  },
  sdlc: {
    stack: "Python 3.11 + FastAPI + React",
    branching_model: "trunk-based",
    test_framework: "pytest + vitest",
    coverage_gate: 80,
    ci_cd_platform: "GitHub Actions",
    review_policy: "2-approvals",
    arch_style: "Hexagonal",
  },
  connectors: ["github", "jira", "clickup"],
  chunk_count: 1204,
};

export function useOverview(tenantId: string) {
  const [data, setData] = useState<LaunchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("elliot_token");

        const response = await fetch(`${apiUrl}/launch/${tenantId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          setData(await response.json());
          setError(null);
        } else {
          setData(MOCK_LAUNCH);
          setError("Using demo data");
        }
      } catch {
        setData(MOCK_LAUNCH);
        setError("Using demo data");
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) fetchData();
  }, [tenantId]);

  return { data, loading, error };
}
