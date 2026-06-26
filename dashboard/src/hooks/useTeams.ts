import { useState, useEffect } from "react";

export interface Member {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  joined_at: string;
  is_active: boolean;
}

const MOCK_MEMBERS: Member[] = [
  {
    id: "a1b2c3d4-0000-0000-0000-000000000001",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    user_id: "u1000000-0000-0000-0000-000000000001",
    role_id: "r1000000-0000-0000-0000-000000000001",
    joined_at: "2026-06-12T10:00:00Z",
    is_active: true,
  },
  {
    id: "a1b2c3d4-0000-0000-0000-000000000002",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    user_id: "u1000000-0000-0000-0000-000000000002",
    role_id: "r1000000-0000-0000-0000-000000000001",
    joined_at: "2026-06-12T10:30:00Z",
    is_active: true,
  },
  {
    id: "a1b2c3d4-0000-0000-0000-000000000003",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    user_id: "u1000000-0000-0000-0000-000000000003",
    role_id: "r1000000-0000-0000-0000-000000000002",
    joined_at: "2026-06-13T09:00:00Z",
    is_active: false,
  },
];

export function useTeams(tenantId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // @ts-expect-error - import.meta.env is available at runtime
        const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("elliot_token");

        const response = await fetch(`${apiUrl}/teams?tenant_id=${tenantId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          setMembers(await response.json());
          setError(null);
        } else {
          setMembers(MOCK_MEMBERS);
          setError("Using demo data");
        }
      } catch {
        setMembers(MOCK_MEMBERS);
        setError("Using demo data");
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) fetchData();
  }, [tenantId]);

  return { members, loading, error };
}
