# Settings Tab Design — Task 42

## Overview

Dashboard Settings tab with two sections: read-only workspace info and an editable SDLC profile form. Reuses `useOverview` for data. Saves via `PUT /sdlc/{tenantId}`.

## Files

| File | Action |
|------|--------|
| `dashboard/src/components/SettingsTab.tsx` | Create — settings form |
| `dashboard/src/App.tsx` | Modify — wire SettingsTab |
| `dashboard/src/App.css` | Modify — form styles |

## SettingsTab component

**Props:** `{ tenantId: string }`

**Section 1 — Workspace (read-only):**
Uses `useOverview(tenantId)` to display org name, domain, residency. Non-editable.

**Section 2 — SDLC Profile (editable form):**
Pre-filled from `useOverview` data. Fields: stack, branching_model, test_framework, coverage_gate (number), ci_cd_platform, review_policy, arch_style.

On "Save": calls `PUT /sdlc/{tenantId}` with Bearer token. Shows:
- Success message: "Settings saved successfully"
- Error message: "Failed to save settings"

## App.tsx change

Replace `<Placeholder name="Settings" />` with `<SettingsTab tenantId={TENANT_ID} />`

## CSS additions

Form layout: label + input stacked, max-width 480px. Save button using accent color. Success/error messages inline below button.
