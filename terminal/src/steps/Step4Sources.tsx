import { useState } from "react";
import OAuthModal from "../components/OAuthModal";

interface SourceConfig {
  id: string;
  icon: string;
  name: string;
  description: string;
  category: "repositories" | "tickets" | "docs" | "databases" | "communication";
}

const SOURCES: SourceConfig[] = [
  { id: "github", icon: "GH", name: "GitHub", description: "Read repos, open pull requests", category: "repositories" },
  { id: "gitlab", icon: "GL", name: "GitLab", description: "Read repos, open merge requests", category: "repositories" },
  { id: "bitbucket", icon: "BB", name: "Bitbucket", description: "Read repos, open pull requests", category: "repositories" },
  { id: "azure", icon: "AZ", name: "Azure Repos", description: "Read repos, open pull requests", category: "repositories" },
  { id: "jira", icon: "JR", name: "Jira", description: "Read issues and sprints", category: "tickets" },
  { id: "linear", icon: "LN", name: "Linear", description: "Read issues and cycles", category: "tickets" },
  { id: "clickup", icon: "CU", name: "ClickUp", description: "Read tasks and spaces", category: "tickets" },
  { id: "confluence", icon: "CF", name: "Confluence", description: "Read pages and spaces", category: "docs" },
  { id: "notion", icon: "ND", name: "Notion", description: "Read databases and pages", category: "docs" },
  { id: "sharepoint", icon: "SP", name: "SharePoint", description: "Read files and pages", category: "docs" },
  { id: "gdrive", icon: "GD", name: "Google Drive", description: "Read files and folders", category: "docs" },
  { id: "postgres", icon: "PG", name: "PostgreSQL", description: "Read schema and data", category: "databases" },
  { id: "mysql", icon: "MY", name: "MySQL", description: "Read schema and data", category: "databases" },
  { id: "vectordb", icon: "VX", name: "Vector DB", description: "Read vectors and metadata", category: "databases" },
  { id: "slack", icon: "SL", name: "Slack", description: "Read channels and messages", category: "communication" },
  { id: "teams", icon: "MT", name: "Microsoft Teams", description: "Read chats and messages", category: "communication" },
];

const SCOPE_MAP: Record<string, string[]> = {
  repositories: ["read_repository", "write_repository", "read_api"],
  tickets: ["read:issues", "read:sprints", "read:projects"],
  docs: ["read:pages", "read:spaces", "read:databases"],
  databases: ["SELECT", "SHOW TABLES", "DESCRIBE"],
  communication: ["channels:read", "messages:read", "files:read"],
};

const SECTIONS = [
  { id: "repositories", label: "Repositories", required: true, description: "Source code Elliot reads, reviews, and writes against." },
  { id: "tickets", label: "Issue & ticket tracking", required: true, description: "Sprints, tickets and acceptance criteria for context." },
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

  const handleAuthorize = () => {
    if (modalSource) {
      setConnectedSources((prev) => new Set(prev).add(modalSource.id));
      setModalSource(null);
    }
  };

  const handleCancel = () => {
    setModalSource(null);
  };

  const requiredSources = SOURCES.filter((s) => SECTIONS.find((sec) => sec.id === s.category)?.required);
  const connectedRequired = requiredSources.filter((s) => connectedSources.has(s.id)).length;
  const canContinue = connectedRequired === requiredSources.length;

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
          Link the systems Elliot draws context from. OAuth is read-only by default and scoped per provider — review each grant before approving.
        </p>
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
