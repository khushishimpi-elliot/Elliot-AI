import { useState } from "react";
import { UsageTab } from "./components/UsageTab";

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
        {tab === "Overview" && <Overview />}
        {tab === "Teams" && <Placeholder name="Teams" />}
        {tab === "Usage" && (
          <UsageTab tenantId="00000000-0000-0000-0000-000000000001" />
        )}
        {tab === "Connectors" && <Placeholder name="Connectors" />}
        {tab === "Settings" && <Placeholder name="Settings" />}
      </section>
    </div>
  );
}

function Overview() {
  return (
    <div className="cards">
      <Card label="Total tokens" value="—" />
      <Card label="This month cost" value="—" />
      <Card label="Active devs" value="—" />
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

function Placeholder({ name }: { name: string }) {
  return <div className="placeholder">{name} — coming soon</div>;
}
