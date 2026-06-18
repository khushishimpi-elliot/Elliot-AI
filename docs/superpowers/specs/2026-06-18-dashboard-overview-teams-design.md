# Dashboard Overview + Teams Tabs Design — Task 39

## Overview

Implement the Overview and Teams tabs in the admin dashboard. Both fetch real data from existing backend endpoints using the same hook pattern as UsageTab.

## Files

| File | Action |
|------|--------|
| `dashboard/src/components/OverviewTab.tsx` | Create — org stats cards + SDLC section |
| `dashboard/src/components/TeamsTab.tsx` | Create — members list table |
| `dashboard/src/hooks/useOverview.ts` | Create — fetch /launch/{tenantId} |
| `dashboard/src/hooks/useTeams.ts` | Create — fetch /members/{tenantId} |
| `dashboard/src/App.tsx` | Modify — wire OverviewTab and TeamsTab |
| `dashboard/src/App.css` | Modify — add table and card styles if missing |

## OverviewTab (`components/OverviewTab.tsx`)

**Data source:** `GET /launch/{tenantId}` (Bearer token from localStorage)

**Layout:**
- 4 stat cards: Org Name, Team Size, Connected (connector count), Knowledge Base (chunk count)
- SDLC section below cards: stack, branching_model, ci_cd_platform, test_framework, review_policy, arch_style
- Loading state, error state

**Props:** `{ tenantId: string }`

## TeamsTab (`components/TeamsTab.tsx`)

**Data source:** `GET /members/{tenantId}` (Bearer token from localStorage)

**Layout:**
- Table with columns: Member ID (first 8 chars of UUID), Role ID (first 8 chars), Joined (formatted date), Status (Active/Inactive badge)
- Loading spinner, empty state ("No members found"), error state

**Props:** `{ tenantId: string }`

## Hooks

**`useOverview(tenantId: string)`**
- Fetches `GET /launch/{tenantId}` with `Authorization: Bearer <token>` from localStorage
- Returns `{ data: LaunchSummary | null, loading: boolean, error: string | null }`

**`useTeams(tenantId: string)`**
- Fetches `GET /members/{tenantId}` with `Authorization: Bearer <token>` from localStorage
- Returns `{ members: Member[], loading: boolean, error: string | null }`

## App.tsx changes

- Add `const TENANT_ID = "00000000-0000-0000-0000-000000000001"` constant
- Replace `<Overview />` with `<OverviewTab tenantId={TENANT_ID} />`
- Replace `<Placeholder name="Teams" />` with `<TeamsTab tenantId={TENANT_ID} />`
- Import both new components
