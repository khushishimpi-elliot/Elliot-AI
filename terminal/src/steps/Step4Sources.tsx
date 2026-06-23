import { useCallback, useEffect, useRef, useState } from "react";
import OAuthModal from "../components/OAuthModal";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Map backend provider names → frontend connector IDs (they are the same
// in this codebase, but explicit mapping avoids silent mismatches)
const PROVIDER_MAP: Record<string, string> = {
  github: "github", gitlab: "gitlab", bitbucket: "bitbucket",
  jira: "jira", linear: "linear", clickup: "clickup",
  slack: "slack", confluence: "confluence", notion: "notion",
  gdrive: "gdrive", sharepoint: "sharepoint",
};

interface SourceConfig {
  id: string;
  icon: string;
  name: string;
  description: string;
  category: "repositories" | "tickets" | "docs" | "databases" | "communication";
  provider: string; // backend provider key
}

const SOURCES: SourceConfig[] = [
  { id: "github",     icon: "GH", name: "GitHub",          description: "Read repos, open pull requests",    category: "repositories", provider: "github"     },
  { id: "gitlab",     icon: "GL", name: "GitLab",          description: "Read repos, open merge requests",   category: "repositories", provider: "gitlab"     },
  { id: "bitbucket",  icon: "BB", name: "Bitbucket",       description: "Read repos, open pull requests",    category: "repositories", provider: "bitbucket"  },
  { id: "jira",       icon: "JR", name: "Jira",            description: "Read issues and sprints",           category: "tickets",      provider: "jira"       },
  { id: "linear",     icon: "LN", name: "Linear",          description: "Read issues and cycles",            category: "tickets",      provider: "linear"     },
  { id: "clickup",    icon: "CU", name: "ClickUp",         description: "Read tasks and spaces",             category: "tickets",      provider: "clickup"    },
  { id: "confluence", icon: "CF", name: "Confluence",      description: "Read pages and spaces",             category: "docs",         provider: "confluence" },
  { id: "notion",     icon: "ND", name: "Notion",          description: "Read databases and pages",          category: "docs",         provider: "notion"     },
  { id: "sharepoint", icon: "SP", name: "SharePoint",      description: "Read files and pages",              category: "docs",         provider: "sharepoint" },
  { id: "gdrive",     icon: "GD", name: "Google Drive",    description: "Read files and folders",            category: "docs",         provider: "gdrive"     },
  { id: "slack",      icon: "SL", name: "Slack",           description: "Read channels and messages",        category: "communication", provider: "slack"     },
];

const SCOPE_MAP: Record<string, string[]> = {
  repositories: ["read_repository", "read_api"],
  tickets:      ["read:issues", "read:sprints"],
  docs:         ["read:pages", "read:spaces"],
  communication:["channels:read", "messages:read"],
};

const SECTIONS = [
  { id: "repositories",  label: "Repositories",             required: true,  description: "Source code Elliot reads, reviews, and writes against." },
  { id: "tickets",       label: "Issue & ticket tracking",   required: true,  description: "Sprints, tickets and acceptance criteria for context." },
  { id: "docs",          label: "Knowledge & documentation", required: false, description: "Wikis, specs and decisions ingested into the knowledge base." },
  { id: "communication", label: "Team communication",        required: false, description: "Optional — surface decisions made in chat." },
];

type Status = "idle" | "loading" | "connected" | "error";

interface Step4Props {
  onContinue: () => void;
  onBack?: () => void;
}

export default function Step4Sources({ onContinue }: Step4Props) {
  const [statuses, setStatuses]     = useState<Record<string, Status>>(
    Object.fromEntries(SOURCES.map((s) => [s.id, "idle"]))
  );
  const [modalSource, setModalSource] = useState<SourceConfig | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tenantId = localStorage.getItem("elliot_tenant_id") ?? "";
  const token    = localStorage.getItem("elliot_token")     ?? "";

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // ── Load already-connected connectors on mount ─────────────────────
  const loadConnectors = useCallback(async () => {
    if (!tenantId) return;
    try {
      const res = await fetch(`${API_URL}/connectors/${tenantId}`, {
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data: { provider: string; status: string }[] = await res.json();
      setStatuses((prev) => {
        const next = { ...prev };
        for (const c of data) {
          const frontendId = PROVIDER_MAP[c.provider];
          if (frontendId) {
            next[frontendId] = c.status === "connected" ? "connected" : "idle";
          }
        }
        return next;
      });
    } catch {
      // backend unreachable — leave statuses as-is
    }
  }, [tenantId]);

  useEffect(() => {
    loadConnectors();
  }, [loadConnectors]);

  // ── Listen for postMessage from the callback popup ──────────────────
  useEffect(() => {
    function onMessage(evt: MessageEvent) {
      if (evt.data?.type !== "connector_callback") return;
      const { provider, status } = evt.data as { provider: string; status: string };
      const frontendId = PROVIDER_MAP[provider] ?? provider;
      setStatuses((prev) => ({
        ...prev,
        [frontendId]: status === "success" ? "connected" : "error",
      }));
      // Reload full list so any server-side state is in sync
      loadConnectors();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadConnectors]);

  // ── Connect a single source ─────────────────────────────────────────
  const handleConnect = (source: SourceConfig) => {
    setModalSource(source);
  };

  const handleAuthorize = async () => {
    if (!modalSource) return;
    const source = modalSource;
    setModalSource(null);
    setStatuses((prev) => ({ ...prev, [source.id]: "loading" }));

    if (!tenantId) {
      // No tenant yet — fall back to optimistic mark
      setStatuses((prev) => ({ ...prev, [source.id]: "connected" }));
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/connectors/${tenantId}/${source.provider}/authorize`,
        { headers: authHeaders }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const { authorization_url } = await res.json() as { authorization_url: string };

      // Open OAuth popup — backend will redirect back to /connectors/callback
      const popup = window.open(
        authorization_url,
        "elliot_oauth",
        "width=640,height=720,noopener=0"
      );

      // Fallback poll if postMessage doesn't arrive (some providers block it)
      let polls = 0;
      pollRef.current = setInterval(async () => {
        polls++;
        if (popup?.closed || polls > 60) {
          if (pollRef.current) clearInterval(pollRef.current);
          // Refresh connector list from backend to pick up newly connected state
          await loadConnectors();
        }
      }, 2000);
    } catch {
      setStatuses((prev) => ({ ...prev, [source.id]: "error" }));
      setTimeout(() => setStatuses((prev) => ({ ...prev, [source.id]: "idle" })), 3000);
    }
  };

  // ── Connect All ─────────────────────────────────────────────────────
  const handleConnectAll = async () => {
    const toConnect = SOURCES.filter((s) => statuses[s.id] === "idle");
    for (const source of toConnect) {
      await new Promise<void>((resolve) => {
        setModalSource(null);
        handleConnectSourceDirect(source).then(resolve);
        setTimeout(resolve, 400); // small gap between popups
      });
    }
  };

  const handleConnectSourceDirect = async (source: SourceConfig) => {
    setStatuses((prev) => ({ ...prev, [source.id]: "loading" }));
    if (!tenantId) {
      setStatuses((prev) => ({ ...prev, [source.id]: "connected" }));
      return;
    }
    try {
      const res = await fetch(
        `${API_URL}/connectors/${tenantId}/${source.provider}/authorize`,
        { headers: authHeaders }
      );
      if (!res.ok) throw new Error();
      const { authorization_url } = await res.json() as { authorization_url: string };
      window.open(authorization_url, "_blank", "width=640,height=720");
    } catch {
      setStatuses((prev) => ({ ...prev, [source.id]: "idle" }));
    }
  };

  // ── Disconnect ──────────────────────────────────────────────────────
  const handleDisconnect = async (source: SourceConfig) => {
    if (!tenantId) return;
    try {
      await fetch(`${API_URL}/connectors/${tenantId}/${source.provider}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      setStatuses((prev) => ({ ...prev, [source.id]: "idle" }));
    } catch {
      // ignore
    }
  };

  const handleCancel = () => setModalSource(null);

  // ── Derived state ───────────────────────────────────────────────────
  const connectedCount = Object.values(statuses).filter((s) => s === "connected").length;
  const requiredSources = SOURCES.filter(
    (s) => SECTIONS.find((sec) => sec.id === s.category)?.required
  );
  const canContinue = requiredSources.some((s) => statuses[s.id] === "connected");
  const allConnected = SOURCES.every((s) => statuses[s.id] === "connected");

  return (
    <div>
      {/* Heading */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: 12 }}>
          INTEGRATIONS · STEP 4 OF 6
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>
          Connect &amp; authorize your sources
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 520, fontFamily: "var(--font-sans)" }}>
          Link the systems Elliot draws context from. OAuth is read-only by default and
          scoped per provider — review each grant before approving.
        </p>
        {!tenantId && (
          <div style={{ marginTop: 10, padding: "8px 14px", background: "rgba(246,173,85,.08)", border: "1px solid rgba(246,173,85,.3)", borderRadius: 6, fontSize: 12, color: "#F6AD55" }}>
            Complete Step 2 (Workspace) first to persist connections to your account.
          </div>
        )}
      </div>

      {/* Connect All */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "rgba(79,255,176,.04)", border: "1px solid rgba(79,255,176,.15)", borderRadius: 6, marginBottom: 28 }}>
        <button
          onClick={handleConnectAll}
          disabled={allConnected}
          style={{ background: allConnected ? "transparent" : "var(--accent-green)", color: allConnected ? "var(--text-muted)" : "#0D1117", border: `1px solid ${allConnected ? "var(--border)" : "transparent"}`, borderRadius: 5, fontSize: 13, fontWeight: 700, padding: "8px 18px", cursor: allConnected ? "default" : "pointer", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>
          {allConnected ? "✓ All connected" : "Connect All"}
        </button>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
          Authorize all integrations at once — each opens its own OAuth window.
        </span>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const sectionSources = SOURCES.filter((s) => s.category === section.id);
        return (
          <div key={section.id} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                {section.label}
              </h3>
              <span style={{ background: section.required ? "rgba(245,158,11,.15)" : "rgba(139,143,168,.1)", border: `1px solid ${section.required ? "var(--amber)" : "var(--border)"}`, color: section.required ? "var(--amber)" : "var(--text-muted)", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 3, fontFamily: "var(--font-sans)", textTransform: "uppercase" }}>
                {section.required ? "required" : "optional"}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>
              {section.description}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {sectionSources.map((source) => (
                <ConnectorCard
                  key={source.id}
                  source={source}
                  status={statuses[source.id]}
                  onConnect={() => handleConnect(source)}
                  onDisconnect={() => handleDisconnect(source)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer bar */}
      <div style={{ position: "sticky", bottom: 0, background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "12px 0", display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          style={{ background: canContinue ? "var(--accent-blue)" : "#1a1d27", color: canContinue ? "white" : "var(--text-muted)", border: "none", borderRadius: 5, fontSize: 14, fontWeight: 600, padding: "10px 20px", cursor: canContinue ? "pointer" : "not-allowed", fontFamily: "var(--font-sans)" }}>
          {canContinue ? "Continue to Index Knowledge →" : "Connect required sources to continue"}
        </button>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
          {connectedCount} source{connectedCount !== 1 ? "s" : ""} linked
        </span>
      </div>

      {/* OAuth modal */}
      <OAuthModal
        isOpen={modalSource !== null}
        serviceName={modalSource?.name ?? ""}
        serviceIcon={modalSource?.icon ?? ""}
        category={modalSource?.category ?? "repositories"}
        scopes={modalSource ? SCOPE_MAP[modalSource.category] ?? [] : []}
        onAuthorize={handleAuthorize}
        onCancel={handleCancel}
      />
    </div>
  );
}

// ── Connector card ────────────────────────────────────────────────────
function ConnectorCard({
  source, status, onConnect, onDisconnect,
}: {
  source: SourceConfig;
  status: Status;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const connected  = status === "connected";
  const loading    = status === "loading";
  const hasError   = status === "error";

  return (
    <div style={{ background: "var(--surface)", border: `1px solid ${connected ? "rgba(79,255,176,.3)" : hasError ? "rgba(255,123,114,.3)" : "var(--border)"}`, borderRadius: 5, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, minHeight: 56, transition: "all .15s ease" }}>
      <div style={{ width: 34, height: 34, background: connected ? "rgba(79,255,176,.1)" : "#1a1d27", border: `1px solid ${connected ? "rgba(79,255,176,.3)" : "var(--border)"}`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
        {source.icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
          {source.name}
        </div>
        <div style={{ fontSize: 11, color: connected ? "var(--accent-green)" : hasError ? "var(--red, #ff7b72)" : "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 4 }}>
          {connected && <span style={{ fontSize: 6, color: "var(--accent-green)" }}>●</span>}
          {connected  ? "connected"   :
           loading    ? "connecting…" :
           hasError   ? "failed — retry" :
           "not connected"}
        </div>
      </div>

      {connected ? (
        <button
          onClick={onDisconnect}
          style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          disabled={loading}
          style={{ background: loading ? "transparent" : "#1a1d27", color: loading ? "var(--text-muted)" : "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, fontWeight: 600, padding: "5px 12px", cursor: loading ? "default" : "pointer", fontFamily: "var(--font-sans)", opacity: loading ? .6 : 1 }}>
          {loading ? "…" : "Connect"}
        </button>
      )}
    </div>
  );
}
