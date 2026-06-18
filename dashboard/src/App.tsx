import { useState } from "react";
import { OverviewTab } from "./components/OverviewTab";
import { TeamsTab } from "./components/TeamsTab";
import { UsageTab } from "./components/UsageTab";
import { ConnectorsTab } from "./components/ConnectorsTab";
import { SettingsTab } from "./components/SettingsTab";

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
        {tab === "Connectors" && <ConnectorsTab tenantId={TENANT_ID} />}
        {tab === "Settings" && <SettingsTab tenantId={TENANT_ID} />}
      </section>
    </div>
  );
}
