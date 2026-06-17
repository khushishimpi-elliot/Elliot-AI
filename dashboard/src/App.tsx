import { useState } from "react";
import { UsageTab } from "./components/UsageTab";
import Overview from "./pages/Overview";
import Teams from "./pages/Teams";
import Connectors from "./pages/Connectors";
import Settings from "./pages/Settings";

const TABS = [
  "Overview",
  "Teams",
  "Usage",
  "Connectors",
  "Settings",
] as const;

type Tab = (typeof TABS)[number];
/*Mock data. In a real application, this data would be fetched from an API or a database. */
const overviewData = {
  stats: {
    totalTokens: "2.4M",
    monthlyCost: "$48.20",
    activeDevelopers: 12,
    mostUsedModel: "Sonnet",
  },

  teamUsage: [
    { name: "Backend", usage: "850K tokens", width: "85%" },
    { name: "Frontend", usage: "600K tokens", width: "60%" },
    { name: "DevOps", usage: "400K tokens", width: "40%" },
    { name: "Data", usage: "250K tokens", width: "25%" },
  ],

  systemStatus: [
    { name: "API Server", status: "Healthy" },
    { name: "Database", status: "Connected" },
    { name: "LLM Service", status: "Running" },
    { name: "Code Parser", status: "Online" },
  ],

  integrations: [
    { name: "GitHub", status: "connected" },
    { name: "GitLab", status: "connected" },
    { name: "Jira", status: "connected" },
    { name: "Slack", status: "not configured" },
  ],

  plan: {
    planType: "Teams",
    teamMembers: 12,
    monthlyLimit: "50K",
  },
};
/* this is mock data for the connectors tab. In a real application, this data would be fetched from an API or a database. */
const connectorsData = [
  {
    name: "GitHub",
    status: "connected",
    primaryLabel: "Org",
    primaryValue: "khushishimpi-elliot",
    secondaryLabel: "Repos synced",
    secondaryValue: 28,
    tertiaryLabel: "Last sync",
    tertiaryValue: "2 hours ago",
  },

  {
    name: "GitLab",
    status: "connected",
    primaryLabel: "Group",
    primaryValue: "elliot-ai-group",
    secondaryLabel: "Repos synced",
    secondaryValue: 15,
    tertiaryLabel: "Last sync",
    tertiaryValue: "1 hour ago",
  },

  {
    name: "Jira",
    status: "connected",
    primaryLabel: "Instance",
    primaryValue: "elliot.atlassian.net",
    secondaryLabel: "Issues linked",
    secondaryValue: 342,
    tertiaryLabel: "Last sync",
    tertiaryValue: "30 minutes ago",
  },

  {
    name: "Slack",
    status: "connected",
    primaryLabel: "Workspace",
    primaryValue: "elliot-systems",
    secondaryLabel: "Channels",
    secondaryValue: 8,
    tertiaryLabel: "Last activity",
    tertiaryValue: "5 minutes ago",
  },

  {
    name: "Linear",
    status: "connected",
    primaryLabel: "Team",
    primaryValue: "ELLIOT",
    secondaryLabel: "Issues linked",
    secondaryValue: 156,
    tertiaryLabel: "Last sync",
    tertiaryValue: "45 minutes ago",
  },

  {
    name: "Bitbucket",
    status: "error",
    primaryLabel: "Workspace",
    primaryValue: "elliot-workspace",
    secondaryLabel: "Issue",
    secondaryValue: "Token expired",
    tertiaryLabel: "Last sync",
    tertiaryValue: "Failed",
  },

  {
    name: "ClickUp",
    status: "connected",
    primaryLabel: "Team",
    primaryValue: "Elliot Systems",
    secondaryLabel: "Tasks linked",
    secondaryValue: 287,
    tertiaryLabel: "Last sync",
    tertiaryValue: "20 minutes ago",
  },
];
/*this is the mock data for the settings tab. In a real application, this data would be fetched from an API or a database. */

const settingsData = {
  organization: {
    name: "Elliot Systems",
    email: "admin@elliotsystems.com",
    plan: "Teams",
  },

  apiKeys: {
    production: "elliot-api-••••••••••••",
    development: "elliot-dev-••••••••••••",
  },

  repository: {
    defaultBranch: "main",
    analysisDepth: "Full (deep analysis)",
    autoSync: true,
  },

  model: {
    defaultModel: "claude-opus-4-8",
    temperature: 0.7,
  },

  notifications: {
    dailySummary: true,
    integrationErrors: true,
    usageAlerts: false,
  },

  team: {
    usedSeats: 12,
    totalSeats: 20,
  },
};

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
        {tab === "Overview" && (
          <Overview
            stats={overviewData.stats}
            teamUsage={overviewData.teamUsage}
            systemStatus={overviewData.systemStatus}
            integrations={overviewData.integrations}
            plan={overviewData.plan}
          />
        )}

        {tab === "Teams" && <Teams />}

        {tab === "Usage" && (
          <UsageTab
            tenantId="00000000-0000-0000-0000-000000000001"
          />
        )}

        {tab === "Connectors" && (
          <Connectors
            connectors={connectorsData}
          />
        )}

        {tab === "Settings" && (
          <Settings settings={settingsData} />
        )}
      </section>
    </div>
  );
}

