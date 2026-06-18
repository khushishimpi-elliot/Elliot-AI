# Settings Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Settings tab with a read-only workspace section and an editable SDLC profile form that saves via `PUT /sdlc/{tenantId}`.

**Architecture:** `SettingsTab` reuses `useOverview` for pre-filling the form. On save, it calls `PUT /sdlc/{tenantId}` directly with a fetch. No new hook needed. `App.tsx` wires it in replacing the Settings placeholder.

**Tech Stack:** React, TypeScript, Vite, plain CSS

---

### Task 1: Create SettingsTab + wire into App + add CSS

**Files:**
- Create: `dashboard/src/components/SettingsTab.tsx`
- Modify: `dashboard/src/App.tsx`
- Modify: `dashboard/src/App.css`

- [ ] **Step 1: Create `dashboard/src/components/SettingsTab.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useOverview } from "../hooks/useOverview";

interface Props {
  tenantId: string;
}

interface SdlcForm {
  stack: string;
  branching_model: string;
  test_framework: string;
  coverage_gate: string;
  ci_cd_platform: string;
  review_policy: string;
  arch_style: string;
}

const EMPTY_FORM: SdlcForm = {
  stack: "",
  branching_model: "",
  test_framework: "",
  coverage_gate: "",
  ci_cd_platform: "",
  review_policy: "",
  arch_style: "",
};

export function SettingsTab({ tenantId }: Props) {
  const { data, loading } = useOverview(tenantId);
  const [form, setForm] = useState<SdlcForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  // Pre-fill form once data loads
  useEffect(() => {
    if (data?.sdlc) {
      setForm({
        stack: data.sdlc.stack ?? "",
        branching_model: data.sdlc.branching_model ?? "",
        test_framework: data.sdlc.test_framework ?? "",
        coverage_gate: data.sdlc.coverage_gate?.toString() ?? "",
        ci_cd_platform: data.sdlc.ci_cd_platform ?? "",
        review_policy: data.sdlc.review_policy ?? "",
        arch_style: data.sdlc.arch_style ?? "",
      });
    }
  }, [data]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveStatus("idle");

    try {
      // @ts-expect-error - import.meta.env is available at runtime
      const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:8000";
      const token = localStorage.getItem("elliot_token");

      const payload = {
        stack: form.stack || null,
        branching_model: form.branching_model || null,
        test_framework: form.test_framework || null,
        coverage_gate: form.coverage_gate ? parseInt(form.coverage_gate, 10) : null,
        ci_cd_platform: form.ci_cd_platform || null,
        review_policy: form.review_policy || null,
        arch_style: form.arch_style || null,
      };

      const response = await fetch(`${apiUrl}/sdlc/${tenantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      setSaveStatus(response.ok ? "success" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof SdlcForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  }

  if (loading) return <div className="placeholder">Loading...</div>;

  return (
    <div className="settings-page">
      {/* Workspace section (read-only) */}
      {data && (
        <section className="settings-section">
          <h2 className="section-title">Workspace</h2>
          <div className="settings-grid">
            <SettingRow label="Organisation" value={data.org.name} />
            <SettingRow label="Domain" value={data.org.domain} />
            <SettingRow label="Team size" value={data.org.team_size ?? "—"} />
            <SettingRow label="Data residency" value={data.org.residency} />
          </div>
        </section>
      )}

      {/* SDLC profile (editable) */}
      <section className="settings-section">
        <h2 className="section-title">SDLC Profile</h2>
        <form onSubmit={handleSave} className="settings-form">
          <FormField
            label="Tech stack"
            value={form.stack}
            onChange={(v) => handleChange("stack", v)}
          />
          <FormField
            label="Branching model"
            value={form.branching_model}
            onChange={(v) => handleChange("branching_model", v)}
          />
          <FormField
            label="Test framework"
            value={form.test_framework}
            onChange={(v) => handleChange("test_framework", v)}
          />
          <FormField
            label="Coverage gate (%)"
            value={form.coverage_gate}
            type="number"
            onChange={(v) => handleChange("coverage_gate", v)}
          />
          <FormField
            label="CI/CD platform"
            value={form.ci_cd_platform}
            onChange={(v) => handleChange("ci_cd_platform", v)}
          />
          <FormField
            label="Review policy"
            value={form.review_policy}
            onChange={(v) => handleChange("review_policy", v)}
          />
          <FormField
            label="Architecture style"
            value={form.arch_style}
            onChange={(v) => handleChange("arch_style", v)}
          />

          <div className="settings-actions">
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saveStatus === "success" && (
              <span className="save-success">✓ Settings saved successfully</span>
            )}
            {saveStatus === "error" && (
              <span className="save-error">Failed to save settings</span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <span className="setting-value">{value}</span>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Read `dashboard/src/App.tsx` and add ConnectorsTab + SettingsTab wiring**

Add `import { SettingsTab } from "./components/SettingsTab";` to imports.
Replace `{tab === "Settings" && <Placeholder name="Settings" />}` with `{tab === "Settings" && <SettingsTab tenantId={TENANT_ID} />}`.

- [ ] **Step 3: Append settings styles to `dashboard/src/App.css`**

```css
.settings-page {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.setting-label {
  color: var(--muted, #6e7681);
  min-width: 120px;
  flex-shrink: 0;
}

.setting-value {
  color: var(--text, #c9d1d9);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  color: var(--muted, #6e7681);
  font-weight: 500;
}

.form-input {
  background: var(--card-bg, #161b22);
  border: 1px solid var(--border, #30363d);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--text, #c9d1d9);
  font-size: 13px;
  font-family: inherit;
  outline: none;
}

.form-input:focus {
  border-color: var(--accent, #3fb950);
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 8px;
}

.save-button {
  background: var(--accent, #3fb950);
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-size: 13px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}

.save-button:hover {
  filter: brightness(1.1);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-success {
  color: var(--accent, #3fb950);
  font-size: 13px;
}

.save-error {
  color: #ef4444;
  font-size: 13px;
}
```

- [ ] **Step 4: Run lint + build**

```bash
cd dashboard
npm run lint && npm run build
```

Expected: no errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
cd ..
git add dashboard/src/components/SettingsTab.tsx dashboard/src/App.tsx dashboard/src/App.css
git commit -m "feat(dashboard): add SettingsTab with workspace info and editable SDLC profile"
```

---

### Task 2: Push and open PR

- [ ] **Step 1: Push the branch**

```bash
git push
```

(Already tracking `origin/dashboard-ui/39-overview-teams`)

- [ ] **Step 2: The existing PR covers tasks 39, 41, 42 all on this branch. Confirm CI is green then merge.**

- [ ] **Step 3: Update ClickUp task 42 to "complete"**

Go to `https://app.clickup.com/t/86d3b0efr` and set status to complete.
