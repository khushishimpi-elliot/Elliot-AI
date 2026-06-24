import { useState, useEffect } from "react";

interface Summary {
  total_tokens: number;
  total_cost: number;
  active_devs: number;
  top_model: string;
}

interface Team {
  name: string;
  tokens: number;
  cost: number;
  pct: number;
}

interface Daily {
  date: string;
  cost: number;
}

interface Developer {
  email: string;
  queries: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

interface UsageData {
  summary: Summary;
  teams: Team[];
  daily: Daily[];
  developers: Developer[];
}

const MOCK_DATA: UsageData = {
  summary: {
    total_tokens: 2400000,
    total_cost: 48.2,
    active_devs: 12,
    top_model: "claude-sonnet-4-6",
  },
  teams: [
    { name: "Backend", tokens: 850000, cost: 18.5, pct: 85 },
    { name: "Frontend", tokens: 600000, cost: 13.2, pct: 60 },
    { name: "Data", tokens: 400000, cost: 8.8, pct: 40 },
    { name: "DevOps", tokens: 250000, cost: 5.5, pct: 25 },
  ],
  daily: [
    { date: "Jun 11", cost: 5.2 },
    { date: "Jun 12", cost: 7.8 },
    { date: "Jun 13", cost: 6.4 },
    { date: "Jun 14", cost: 8.9 },
    { date: "Jun 15", cost: 7.2 },
    { date: "Jun 16", cost: 9.3 },
    { date: "Jun 17", cost: 3.4 },
  ],
  developers: [
    {
      email: "shrushti@elliotsystems.com",
      queries: 145,
      input_tokens: 320000,
      output_tokens: 180000,
      cost_usd: 12.4,
    },
    {
      email: "khushi@elliotsystems.com",
      queries: 98,
      input_tokens: 210000,
      output_tokens: 120000,
      cost_usd: 8.2,
    },
    {
      email: "astika@elliotsystems.com",
      queries: 87,
      input_tokens: 180000,
      output_tokens: 95000,
      cost_usd: 6.8,
    },
  ],
};

export function useUsage(tenantId: string) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:8000";

        // Try to fetch from backend
        const response = await fetch(`${apiUrl}/usage/summary/${tenantId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Use mock data for now
          setData(MOCK_DATA);
          setError(null);
        } else {
          // Use mock data if API fails
          setData(MOCK_DATA);
          setError("Using demo data");
        }
      } catch {
        // Use mock data if API call fails
        setData(MOCK_DATA);
        setError("Using demo data");
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) {
      fetchUsageData();
    }
  }, [tenantId]);

  return { data, loading, error };
}
