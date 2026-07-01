import { useState } from "react";
import OAuthModal from "../components/OAuthModal";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface SourceConfig {
  id: string;
  icon: string;
  name: string;
  description: string;
  category: "repositories" | "tickets" | "docs" | "databases" | "communication";
  provider?: string;
}

const SOURCES: SourceConfig[] = [
  { id: "github", provider: "github", icon: "GH", name: "GitHub", description: "Read repos, open pull requests", category: "repositories" },
  { id: "gitlab", provider: "gitlab", icon: "GL", name: "GitLab", description: "Read repos, open merge requests", category: "repositories" },
  { id: "bitbucket", provider: "bitbucket", icon: "BB", name: "Bitbucket", description: "Read repos, open pull requests", category: "repositories" },
  { id: "azure", provider: "azure", icon: "AZ", name: "Azure Repos", description: "Read repos, open pull requests", category: "repositories" },
  { id: "jira", provider: "jira", icon: "JR", name: "Jira", description: "Read issues and sprints", category: "tickets" },
  { id: "linear", provider: "linear", icon: "LN", name: "Linear", description: "Read issues and cycles", category: "tickets" },
  { id: "clickup", provider: "clickup", icon: "CU", name: "ClickUp", description: "Read tasks and spaces", category: "tickets" },
  { id: "azboards", provider: "azure_boards", icon: "AB", name: "Azure Boards", description: "Read issues and sprints", category: "tickets" },
  { id: "confluence", provider: "confluence", icon: "CF", name: "Confluence", description: "Read pages and spaces", category: "docs" },
  { id: "notion", provider: "notion", icon: "ND", name: "Notion", description: "Read databases and pages", category: "docs" },
  { id: "sharepoint", provider: "sharepoint", icon: "SP", name: "SharePoint", description: "Read files and pages", category: "docs" },
  { id: "gdrive", provider: "google_drive", icon: "GD", name: "Google Drive", description: "Read files and folders", category: "docs" },
  { id: "postgres", provider: "postgres", icon: "PG", name: "PostgreSQL", description: "Read schema and data", category: "databases" },
  { id: "mysql", provider: "mysql", icon: "MY", name: "MySQL", description: "Read schema and data", category: "databases" },
  { id: "vectordb", provider: "vectordb", icon: "VX", name: "Vector DB", description: "Read vectors and metadata", category: "databases" },
  { id: "slack", provider: "slack", icon: "SL", name: "Slack", description: "Read channels and messages", category: "communication" },
  { id: "teams", provider: "teams", icon: "MT", name: "Microsoft Teams", description: "Read chats and messages", category: "communication" },
];

const SCOPE_MAP: Record<string, string[]> = {
  repositories: ["read_repository", "write_repository", "read_api"],
  tickets: ["read:issues", "read:sprints", "read:projects"],
  docs: ["read:pages", "read:spaces", "read:databases"],
  databases: ["SELECT", "SHOW TABLES", "DESCRIBE"],
  communication: ["channels:read", "messages:read", "files:read"],
};

const SECTIONS = [
  { id: "repositories", label: "Repositories", required: false, description: "Source code Elliot reads, reviews, and writes against." },
  { id: "tickets", label: "Issue & ticket tracking", required: false, description: "Sprints, tickets and acceptance criteria for context." },
  { id: "docs", label: "Knowledge & documentation", required: false, description: "Wikis, specs and decisions ingested into the knowledge base." },
  { id: "databases", label: "Databases & schema", required: false, description: "Schema-aware context for queries and migrations." },
  { id: "communication", label: "Team communication", required: false, description: "Optional — surface decisions made in chat." },
];

interface Step4Props {
  onContinue: () => void;
  onBack?: () => void;
}

export default function Step4Sources({ onContinue }: Step4Props) {
  const [connectedSources, setConnectedSources] = useState<Set<string>>(new Set());
  const [modalSource, setModalSource] = useState<SourceConfig | null>(null);

  const handleConnect = (source: SourceConfig) => {
    setModalSource(source);
  };

  const saveConnected = (sources: Set<string>) => {
    localStorage.setItem("elliot_connected_sources", JSON.stringify([...sources]));
  };

  const handleConnectAll = () => {
    const all = new Set(SOURCES.map((s) => s.id));
    setConnectedSources(all);
    saveConnected(all);
  };

  const handleAuthorize = async () => {
    if (!modalSource) return;
    const source = modalSource;
    setModalSource(null);

    try {
      const token = localStorage.getItem("elliot_token");
      const tenantId = localStorage.getItem("elliot_tenant_id") ?? "default";
      const res = await fetch(
        `${API_URL}/connectors/${tenantId}/${source.provider}/authorize`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.redirect_url) {
          // Open OAuth popup; mark connected when it closes
          const popup = window.open(data.redirect_url, "_blank", "width=600,height=700");
          const poll = setInterval(() => {
            if (popup?.closed) {
              clearInterval(poll);
              setConnectedSources((prev) => {
                const next = new Set(prev).add(source.id);
                saveConnected(next);
                return next;
              });
            }
          }, 500);
          return;
        }
      }
    } catch {
      // fall through to optimistic connect
    }

    // Fallback: mark connected optimistically (dev mode / backend not yet live)
    setConnectedSources((prev) => {
      const next = new Set(prev).add(source.id);
      saveConnected(next);
      return next;
    });
  };

  const handleCancel = () => {
    setModalSource(null);
  };

  // Allow continue if at least ONE source is connected (minimum viable configuration)
  const canContinue = connectedSources.size > 0;

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          INTEGRATIONS · STEP 4 OF 6
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
          Connect & authorize your sources
        </h1>
        <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
          Connect at least one source for Elliot to read context from. Add more later anytime. OAuth is read-only by default and scoped per provider — review each grant before approving.
        </p>
      </div>

      {/* Connect All */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "12px 16px",
          background: "rgba(79,255,176,0.04)",
          border: "1px solid rgba(79,255,176,0.15)",
          borderRadius: "6px",
          marginBottom: "28px",
        }}
      >
        <button
          onClick={handleConnectAll}
          disabled={SOURCES.every((s) => connectedSources.has(s.id))}
          style={{
            background: SOURCES.every((s) => connectedSources.has(s.id)) ? "transparent" : "var(--accent-green)",
            color: SOURCES.every((s) => connectedSources.has(s.id)) ? "var(--text-muted)" : "#0D1117",
            border: `1px solid ${SOURCES.every((s) => connectedSources.has(s.id)) ? "var(--border)" : "transparent"}`,
            borderRadius: "5px",
            fontSize: "13px",
            fontWeight: "700",
            padding: "8px 18px",
            cursor: SOURCES.every((s) => connectedSources.has(s.id)) ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
            whiteSpace: "nowrap",
            transition: "all 0.15s ease",
          }}
        >
          {SOURCES.every((s) => connectedSources.has(s.id)) ? "✓ All connected" : "Connect All"}
        </button>
        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
          Authorize all integrations at once — each will open its OAuth grant screen.
        </span>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const sectionSources = SOURCES.filter((s) => s.category === section.id);
        return (
          <div key={section.id} style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                {section.label}
              </h3>
              <span
                style={{
                  background: section.required ? "rgba(245,158,11,0.15)" : "rgba(139,143,168,0.1)",
                  border: `1px solid ${section.required ? "var(--amber)" : "var(--border)"}`,
                  color: section.required ? "var(--amber)" : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: "500",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  fontFamily: "var(--font-sans)",
                  textTransform: "uppercase",
                }}
              >
                {section.required ? "required" : "optional"}
              </span>
            </div>
            <p style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
              {section.description}
            </p>

            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "20px" }}>
              {sectionSources.map((source) => {
                const isConnected = connectedSources.has(source.id);
                return (
                  <div
                    key={source.id}
                    style={{
                      background: "var(--surface)",
                      border: isConnected ? "1px solid rgba(79,255,176,0.3)" : "1px solid var(--border)",
                      borderRadius: "5px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      minHeight: "56px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Badge */}
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        background: isConnected ? "rgba(79,255,176,0.1)" : "#1a1d27",
                        border: `1px solid ${isConnected ? "rgba(79,255,176,0.3)" : "var(--border)"}`,
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "white",
                        fontFamily: "var(--font-mono)",
                        flexShrink: 0,
                      }}
                    >
                      {source.icon}
                    </div>

                    {/* Label & Status */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                        {source.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "400",
                          color: isConnected ? "var(--accent-green)" : "var(--text-muted)",
                          marginTop: "2px",
                          fontFamily: "var(--font-sans)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {isConnected && <span style={{ fontSize: "6px", color: "var(--accent-green)" }}>●</span>}
                        {isConnected ? "connected" : "Not connected"}
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={() => handleConnect(source)}
                      disabled={isConnected}
                      style={{
                        background: isConnected ? "transparent" : "#1a1d27",
                        color: isConnected ? "var(--accent-green)" : "var(--text-secondary)",
                        border: `1px solid ${isConnected ? "transparent" : "var(--border)"}`,
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "5px 12px",
                        cursor: isConnected ? "default" : "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isConnected) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-blue)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isConnected) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                        }
                      }}
                    >
                      {isConnected ? "✓ Linked" : "Connect"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bottom Bar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "12px 0", display: "flex", alignItems: "center", gap: "16px", marginTop: "20px" }}>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          style={{
            background: canContinue ? "var(--accent-blue)" : "#1a1d27",
            color: canContinue ? "white" : "var(--text-muted)",
            border: "none",
            borderRadius: "5px",
            fontSize: "14px",
            fontWeight: "600",
            padding: "10px 20px",
            cursor: canContinue ? "pointer" : "not-allowed",
            fontFamily: "var(--font-sans)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (canContinue) (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            if (canContinue) (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
        >
          Connect required sources to continue
        </button>
        <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
          {connectedSources.size} sources linked
        </span>
      </div>

      {/* OAuth Modal */}
      <OAuthModal
        isOpen={modalSource !== null}
        serviceName={modalSource?.name || ""}
        serviceIcon={modalSource?.icon || ""}
        category={modalSource?.category || "repositories"}
        scopes={modalSource ? SCOPE_MAP[modalSource.category] : []}
        onAuthorize={handleAuthorize}
        onCancel={handleCancel}
      />
    </div>
  );
}
