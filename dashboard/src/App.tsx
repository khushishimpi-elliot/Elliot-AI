import { useState } from "react";
import { ConnectorsTab } from "./components/ConnectorsTab";
import { OverviewTab } from "./components/OverviewTab";
import { SettingsTab } from "./components/SettingsTab";
import { TeamsTab } from "./components/TeamsTab";
import { UsageTab } from "./components/UsageTab";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const TABS = ["Overview", "Teams", "Usage", "Connectors", "Settings"] as const;
type Tab = (typeof TABS)[number];

const NAV_ICONS: Record<Tab, string> = {
  Overview:   "◈",
  Teams:      "◎",
  Usage:      "▦",
  Connectors: "⬡",
  Settings:   "⚙",
};

export default function App() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="app">
      {/* ── Sidebar ── */}
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="dash-brand-icon">⚡</span>
          <span className="dash-brand-text">
            ELLIOT<span>-AI</span>
          </span>
        </div>
        <div className="dash-brand-sub">Admin Dashboard</div>

        <nav className="dash-nav">
          {TABS.map((t) => (
            <button
              key={t}
              className={`dash-nav-item ${t === tab ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              <span className="dash-nav-icon">{NAV_ICONS[t]}</span>
              {t}
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-bottom">
          <span className="dash-dot" />
          elliotsystems.com
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="dash-main">
        <div className="dash-topbar">
          <span className="dash-topbar-title">{tab}</span>
          <span className="dash-topbar-role">Admin view</span>
        </div>
        <div className="dash-content">
          {tab === "Overview"   && <OverviewTab   tenantId={TENANT_ID} />}
          {tab === "Teams"      && <TeamsTab      tenantId={TENANT_ID} />}
          {tab === "Usage"      && <UsageTab      tenantId={TENANT_ID} />}
          {tab === "Connectors" && <ConnectorsTab tenantId={TENANT_ID} />}
          {tab === "Settings"   && <SettingsTab   tenantId={TENANT_ID} />}
        </div>
      </main>
    </div>
  );
}
