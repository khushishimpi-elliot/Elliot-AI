# Dashboard Overview + Teams Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Overview and Teams dashboard tabs with real backend data, following the existing `useUsage` hook + component pattern.

**Architecture:** Two new hooks (`useOverview`, `useTeams`) fetch from `/launch` and `/members` endpoints respectively, falling back to mock data if the API is unavailable. Two new React components render the data. `App.tsx` wires them in replacing the existing placeholders.

**Tech Stack:** React, TypeScript, Vite, plain CSS

---

### Task 1: Create feature branch

**Files:** None — git only

- [ ] **Step 1: Checkout main and pull**

```bash
cd Elliot-AI
git checkout main
git pull
```

- [ ] **Step 2: Create branch**

```bash
git checkout -b dashboard-ui/39-overview-teams
```

Expected: `Switched to a new branch 'dashboard-ui/39-overview-teams'`

---

### Task 2: Create useOverview hook

**Files:**
- Create: `dashboard/src/hooks/useOverview.ts`

- [ ] **Step 1: Create `dashboard/src/hooks/useOverview.ts`**

```typescript
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
        // @ts-expect-error - import.meta.env is available at runtime
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
```

- [ ] **Step 2: Verify import works**

```bash
cd dashboard
node -e "console.log('ok')"
```

No TypeScript errors should appear when the project builds.

- [ ] **Step 3: Commit**

```bash
cd ..
git add dashboard/src/hooks/useOverview.ts
git commit -m "feat(dashboard): add useOverview hook"
```

---

### Task 3: Create useTeams hook

**Files:**
- Create: `dashboard/src/hooks/useTeams.ts`

- [ ] **Step 1: Create `dashboard/src/hooks/useTeams.ts`**

```typescript
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

        const response = await fetch(`${apiUrl}/members/${tenantId}`, {
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
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/hooks/useTeams.ts
git commit -m "feat(dashboard): add useTeams hook"
```

---

### Task 4: Create OverviewTab component

**Files:**
- Create: `dashboard/src/components/OverviewTab.tsx`

- [ ] **Step 1: Create `dashboard/src/components/OverviewTab.tsx`**

```tsx
import { useOverview } from "../hooks/useOverview";

interface Props {
  tenantId: string;
}

export function OverviewTab({ tenantId }: Props) {
  const { data, loading, error } = useOverview(tenantId);

  if (loading) return <div className="placeholder">Loading...</div>;
  if (!data) return <div className="placeholder">No data available</div>;

  return (
    <div>
      {error && <div className="demo-banner">{error}</div>}
      <div className="cards">
        <Card label="Organisation" value={data.org.name} />
        <Card label="Team Size" value={data.org.team_size ?? "—"} />
        <Card
          label="Connected"
          value={`${data.connectors.length} connector${data.connectors.length !== 1 ? "s" : ""}`}
        />
        <Card
          label="Knowledge Base"
          value={`${data.chunk_count.toLocaleString()} chunks`}
        />
      </div>
      {data.sdlc && (
        <div className="sdlc-section">
          <h2 className="section-title">SDLC Standards</h2>
          <div className="sdlc-grid">
            {data.sdlc.stack && (
              <SdlcRow label="Stack" value={data.sdlc.stack} />
            )}
            {data.sdlc.branching_model && (
              <SdlcRow label="Branching" value={data.sdlc.branching_model} />
            )}
            {data.sdlc.test_framework && (
              <SdlcRow label="Testing" value={data.sdlc.test_framework} />
            )}
            {data.sdlc.ci_cd_platform && (
              <SdlcRow label="CI/CD" value={data.sdlc.ci_cd_platform} />
            )}
            {data.sdlc.review_policy && (
              <SdlcRow label="Reviews" value={data.sdlc.review_policy} />
            )}
            {data.sdlc.arch_style && (
              <SdlcRow label="Architecture" value={data.sdlc.arch_style} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}

function SdlcRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="sdlc-label">{label}</dt>
      <dd className="sdlc-value">{value}</dd>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/OverviewTab.tsx
git commit -m "feat(dashboard): add OverviewTab component"
```

---

### Task 5: Create TeamsTab component

**Files:**
- Create: `dashboard/src/components/TeamsTab.tsx`

- [ ] **Step 1: Create `dashboard/src/components/TeamsTab.tsx`**

```tsx
import { useTeams } from "../hooks/useTeams";

interface Props {
  tenantId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function short(uuid: string): string {
  return uuid.slice(0, 8);
}

export function TeamsTab({ tenantId }: Props) {
  const { members, loading, error } = useTeams(tenantId);

  if (loading) return <div className="placeholder">Loading...</div>;

  return (
    <div>
      {error && <div className="demo-banner">{error}</div>}
      {members.length === 0 ? (
        <div className="placeholder">No members found</div>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Role ID</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td className="mono">{short(m.id)}</td>
                <td className="mono">{short(m.role_id)}</td>
                <td>{formatDate(m.joined_at)}</td>
                <td>
                  <span className={`badge ${m.is_active ? "badge-active" : "badge-inactive"}`}>
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add dashboard/src/components/TeamsTab.tsx
git commit -m "feat(dashboard): add TeamsTab component"
```

---

### Task 6: Wire into App.tsx + add CSS

**Files:**
- Modify: `dashboard/src/App.tsx`
- Modify: `dashboard/src/App.css`

- [ ] **Step 1: Read `dashboard/src/App.tsx` then replace full content with:**

```tsx
import { useState } from "react";
import { OverviewTab } from "./components/OverviewTab";
import { TeamsTab } from "./components/TeamsTab";
import { UsageTab } from "./components/UsageTab";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const TABS = ["Overview", "Teams", "Usage", "Connectors", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function App() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="app">
      <header>
        <h1>ELLIOT-AI · Dashboard</h1>
        <span className="role">Admin view</span>
      </header>
      <nav>
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      <section className="content">
        {tab === "Overview" && <OverviewTab tenantId={TENANT_ID} />}
        {tab === "Teams" && <TeamsTab tenantId={TENANT_ID} />}
        {tab === "Usage" && <UsageTab tenantId={TENANT_ID} />}
        {tab === "Connectors" && <Placeholder name="Connectors" />}
        {tab === "Settings" && <Placeholder name="Settings" />}
      </section>
    </div>
  );
}

function Placeholder({ name }: { name: string }) {
  return <div className="placeholder">{name} — coming soon</div>;
}
```

- [ ] **Step 2: Append to `dashboard/src/App.css`**

```css
.demo-banner {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 16px;
}

.sdlc-section {
  margin-top: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text, #c9d1d9);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sdlc-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 16px;
  max-width: 480px;
}

.sdlc-label {
  color: var(--muted, #6e7681);
  font-size: 12px;
}

.sdlc-value {
  color: var(--text, #c9d1d9);
  font-size: 12px;
  margin: 0;
}

.members-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.members-table th {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border, #30363d);
  color: var(--muted, #6e7681);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.members-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(48, 54, 61, 0.5);
  color: var(--text, #c9d1d9);
}

.members-table .mono {
  font-family: monospace;
  color: var(--muted, #6e7681);
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.badge-active {
  background: rgba(63, 185, 80, 0.15);
  color: #3fb950;
}

.badge-inactive {
  background: rgba(110, 118, 129, 0.15);
  color: #6e7681;
}
```

- [ ] **Step 3: Run lint + build**

```bash
cd dashboard
npm run lint && npm run build
```

Expected: no errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
cd ..
git add dashboard/src/App.tsx dashboard/src/App.css
git commit -m "feat(dashboard): wire OverviewTab and TeamsTab into App"
```

---

### Task 7: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin dashboard-ui/39-overview-teams
```

- [ ] **Step 2: Open PR on GitHub**

Title: `39. Overview + Teams tabs`

Body:
```
Implements Overview and Teams tabs in the admin dashboard.

Changes:
- `dashboard/src/hooks/useOverview.ts` — fetch /launch/{tenantId}, mock fallback
- `dashboard/src/hooks/useTeams.ts` — fetch /members/{tenantId}, mock fallback
- `dashboard/src/components/OverviewTab.tsx` — 4 stat cards + SDLC section
- `dashboard/src/components/TeamsTab.tsx` — members table with Active/Inactive badges
- `dashboard/src/App.tsx` — wire new components, add TENANT_ID constant
- `dashboard/src/App.css` — table, badge, SDLC grid styles

ClickUp: https://app.clickup.com/t/86d3b0ef2
```

- [ ] **Step 3: Wait for CI to go green, then merge**

- [ ] **Step 4: Update ClickUp task 39 to "complete"**

Go to `https://app.clickup.com/t/86d3b0ef2` and set status to complete.
