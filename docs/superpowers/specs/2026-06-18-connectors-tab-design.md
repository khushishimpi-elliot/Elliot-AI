# Connectors Status Tab Design — Task 41

## Overview

Dashboard tab showing the connection status of all integrations for the tenant. Follows the same hook + component pattern as Overview and Teams tabs.

## Files

| File | Action |
|------|--------|
| `dashboard/src/components/ConnectorsTab.tsx` | Create — connector cards |
| `dashboard/src/hooks/useConnectors.ts` | Create — fetch /connectors/{tenantId} |
| `dashboard/src/App.tsx` | Modify — wire ConnectorsTab |
| `dashboard/src/App.css` | Modify — connector card styles |

## useConnectors hook

**Endpoint:** `GET /connectors/{tenantId}` with Bearer token from localStorage
**Returns:** `{ connectors: ConnectorStatus[], loading, error }`
**Mock fallback:** 7 connectors (github, gitlab, bitbucket, jira, linear, slack, clickup) — mix of connected and not_connected

```typescript
interface ConnectorStatus {
  id: string;
  provider: string;
  status: "connected" | "not_connected";
  last_synced: string | null;
  scopes: string[];
}
```

## ConnectorsTab component

**Props:** `{ tenantId: string }`

**Layout:** Grid of connector cards, one per provider.

**Each card shows:**
- Provider letter icon (e.g. "G" for GitHub) in accent color
- Provider name (capitalized)
- Status badge: green "Connected" or grey "Not Connected"
- Last synced: formatted date or "Never"
- Scopes: comma-separated list or "—"

**States:** loading spinner, error banner (demo data), empty state

## App.tsx change

Replace `<Placeholder name="Connectors" />` with `<ConnectorsTab tenantId={TENANT_ID} />`
