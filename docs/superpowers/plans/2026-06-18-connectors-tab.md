# Connectors Status Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Connectors status tab in the admin dashboard showing connection status, last synced date, and scopes for each integration.

**Architecture:** New `useConnectors` hook fetches `GET /connectors/{tenantId}` with Bearer token, falling back to mock data. `ConnectorsTab` renders a card grid. `App.tsx` wires it in replacing the Connectors placeholder.

**Tech Stack:** React, TypeScript, Vite, plain CSS

---

### Task 1: Create useConnectors hook + ConnectorsTab + wire into App

**Files:**
- Create: `dashboard/src/hooks/useConnectors.ts`
- Create: `dashboard/src/components/ConnectorsTab.tsx`
- Modify: `dashboard/src/App.tsx`
- Modify: `dashboard/src/App.css`

- [ ] **Step 1: Create `dashboard/src/hooks/useConnectors.ts`**

```typescript
import { useState, useEffect } from "react";

export interface ConnectorStatus {
  id: string;
  provider: string;
  status: "connected" | "not_connected";
  last_synced: string | null;
  scopes: string[];
}

const MOCK_CONNECTORS: ConnectorStatus[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    provider: "github",
    status: "connected",
    last_synced: "2026-06-17T14:30:00Z",
    scopes: ["repo", "read:org"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    provider: "jira",
    status: "connected",
    last_synced: "2026-06-17T12:00:00Z",
    scopes: ["read:jira-work"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    provider: "clickup",
    status: "connected",
    last_synced: "2026-06-16T09:00:00Z",
    scopes: ["task:read"],
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    provider: "slack",
    status: "not_connected",
    last_synced: null,
    scopes: [],
  },
  {
    id: "c1000000-0000-0000-0000-000000000005",
    provider: "gitlab",
    status: "not_connected",
    last_synced: null,
    scopes: [],
  },
  {
    id: "c1000000-0000-0000-0000-000000000006",
    provider: "bitbucket",
    status: "not_connected",
    last_synced: null,
    scopes: [],
  },
  {
    id: "c1000000-0000-0000-0000-000000000007",
    provider: "linear",
    status: "not_connected",
    last_synced: null,
    scopes: [],
  },
];

export function useConnectors(tenantId: string) {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // @ts-expect-error - import.meta.env is available at runtime
        const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("elliot_token");

        const response = await fetch(`${apiUrl}/connectors/${tenantId}`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          setConnectors(await response.json());
          setError(null);
        } else {
          setConnectors(MOCK_CONNECTORS);
          setError("Using demo data");
        }
      } catch {
        setConnectors(MOCK_CONNECTORS);
        setError("Using demo data");
      } finally {
        setLoading(false);
      }
    };

    if (tenantId) fetchData();
  }, [tenantId]);

  return { connectors, loading, error };
}
```

- [ ] **Step 2: Create `dashboard/src/components/ConnectorsTab.tsx`**

```tsx
import { useConnectors } from "../hooks/useConnectors";

interface Props {
  tenantId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function providerInitial(provider: string): string {
  return provider.charAt(0).toUpperCase();
}

export function ConnectorsTab({ tenantId }: Props) {
  const { connectors, loading, error } = useConnectors(tenantId);

  if (loading) return <div className="placeholder">Loading...</div>;

  return (
    <div>
      {error && <div className="demo-banner">{error}</div>}
      <div className="connector-grid">
        {connectors.map((c) => (
          <div key={c.id} className={`connector-card ${c.status === "connected" ? "connector-card--connected" : ""}`}>
            <div className="connector-header">
              <div className="connector-icon">{providerInitial(c.provider)}</div>
              <div>
                <div className="connector-name">
                  {c.provider.charAt(0).toUpperCase() + c.provider.slice(1)}
                </div>
                <span className={`badge ${c.status === "connected" ? "badge-active" : "badge-inactive"}`}>
                  {c.status === "connected" ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>
            <div className="connector-meta">
              <div className="connector-row">
                <span className="connector-label">Last synced</span>
                <span className="connector-value">
                  {c.last_synced ? formatDate(c.last_synced) : "Never"}
                </span>
              </div>
              <div className="connector-row">
                <span className="connector-label">Scopes</span>
                <span className="connector-value">
                  {c.scopes.length > 0 ? c.scopes.join(", ") : "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Read `dashboard/src/App.tsx` and update the Connectors placeholder**

Import `ConnectorsTab` and replace `<Placeholder name="Connectors" />` with `<ConnectorsTab tenantId={TENANT_ID} />`.

The imports section should look like:
```tsx
import { useState } from "react";
import { ConnectorsTab } from "./components/ConnectorsTab";
import { OverviewTab } from "./components/OverviewTab";
import { TeamsTab } from "./components/TeamsTab";
import { UsageTab } from "./components/UsageTab";
```

And the content section:
```tsx
{tab === "Overview" && <OverviewTab tenantId={TENANT_ID} />}
{tab === "Teams" && <TeamsTab tenantId={TENANT_ID} />}
{tab === "Usage" && <UsageTab tenantId={TENANT_ID} />}
{tab === "Connectors" && <ConnectorsTab tenantId={TENANT_ID} />}
{tab === "Settings" && <Placeholder name="Settings" />}
```

- [ ] **Step 4: Append connector styles to `dashboard/src/App.css`**

```css
.connector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.connector-card {
  background: var(--card-bg, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: 8px;
  padding: 16px;
  opacity: 0.7;
}

.connector-card--connected {
  opacity: 1;
  border-color: rgba(63, 185, 80, 0.3);
}

.connector-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.connector-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(110, 118, 129, 0.2);
  color: var(--muted, #6e7681);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.connector-card--connected .connector-icon {
  background: rgba(63, 185, 80, 0.15);
  color: #3fb950;
}

.connector-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--text, #c9d1d9);
  margin-bottom: 4px;
}

.connector-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
}

.connector-row {
  display: flex;
  gap: 8px;
}

.connector-label {
  color: var(--muted, #6e7681);
  min-width: 72px;
  flex-shrink: 0;
}

.connector-value {
  color: var(--text, #c9d1d9);
  word-break: break-word;
}
```

- [ ] **Step 5: Run lint + build**

```bash
cd dashboard
npm run lint && npm run build
```

Expected: no errors, build succeeds.

- [ ] **Step 6: Commit everything**

```bash
cd ..
git add dashboard/src/hooks/useConnectors.ts dashboard/src/components/ConnectorsTab.tsx dashboard/src/App.tsx dashboard/src/App.css
git commit -m "feat(dashboard): add ConnectorsTab with status, last synced, and scopes"
```

---

### Task 2: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin dashboard-ui/39-overview-teams
```

(We reuse the same branch since we're still on it from task 39.)

- [ ] **Step 2: The PR for task 39 already exists — just confirm task 41 is included in the same branch or open a separate PR**

If the task 39 PR hasn't been merged yet, these changes will be included automatically when you push.

If it has been merged, create a new PR titled `41. Connectors status tab` with body:
```
Implements Connectors status tab in the admin dashboard.

Changes:
- `dashboard/src/hooks/useConnectors.ts` — fetch /connectors/{tenantId}, mock fallback
- `dashboard/src/components/ConnectorsTab.tsx` — connector cards with status, last synced, scopes
- `dashboard/src/App.tsx` — wire ConnectorsTab
- `dashboard/src/App.css` — connector grid and card styles

ClickUp: https://app.clickup.com/t/86d3b0efe
```

- [ ] **Step 3: Update ClickUp task 41 to "complete"**

Go to `https://app.clickup.com/t/86d3b0efe` and set status to complete.
