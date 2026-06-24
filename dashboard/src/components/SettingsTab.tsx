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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
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
      <section className="settings-section">
        <h2 className="section-title">SDLC Profile</h2>
        <form onSubmit={handleSave} className="settings-form">
          <FormField label="Tech stack" value={form.stack} onChange={(v) => handleChange("stack", v)} />
          <FormField label="Branching model" value={form.branching_model} onChange={(v) => handleChange("branching_model", v)} />
          <FormField label="Test framework" value={form.test_framework} onChange={(v) => handleChange("test_framework", v)} />
          <FormField label="Coverage gate (%)" value={form.coverage_gate} type="number" onChange={(v) => handleChange("coverage_gate", v)} />
          <FormField label="CI/CD platform" value={form.ci_cd_platform} onChange={(v) => handleChange("ci_cd_platform", v)} />
          <FormField label="Review policy" value={form.review_policy} onChange={(v) => handleChange("review_policy", v)} />
          <FormField label="Architecture style" value={form.arch_style} onChange={(v) => handleChange("arch_style", v)} />
          <div className="settings-actions">
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saveStatus === "success" && <span className="save-success">✓ Settings saved successfully</span>}
            {saveStatus === "error" && <span className="save-error">Failed to save settings</span>}
          </div>
        </form>
      </section>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="setting-row">
      <span className="setting-label">{label}</span>
      <span className="setting-value">{value}</span>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
