import { useState, useRef, useEffect } from "react";
import { ELLIOT } from "./data";

interface TerminalProps {
  onReset?: () => void;
}

interface Message {
  type: "query" | "response" | "thinking" | "error";
  content: string;
  sources?: Record<string, number>;
}

export default function Terminal({ onReset }: TerminalProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { type: "query", content: query }]);
    setMessages((prev) => [...prev, { type: "thinking", content: "▋ thinking..." }]);
    setLoading(true);

    const tenantId =
      localStorage.getItem("elliot_tenant_id") ||
      "00000000-0000-0000-0000-000000000001";
    const userId =
      localStorage.getItem("elliot_user_id") ||
      "00000000-0000-0000-0000-000000000002";
    const jwt = localStorage.getItem("jwt") || "";

    let response = "";

    try {
      const res = await fetch(`${API_URL}/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          query,
          tenant_id: tenantId,
          user_id: userId,
          team_id: "00000000-0000-0000-0000-000000000003",
        }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            type: "error",
            content: `Error ${res.status}: ${res.statusText}`,
          },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      setMessages((prev) => prev.slice(0, -1)); // Remove "thinking" message

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              response += data.token;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.type === "response") {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: response },
                  ];
                }
                return [...prev, { type: "response", content: response }];
              });
            }
            if (data.done) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.type === "response") {
                  return [
                    ...prev.slice(0, -1),
                    {
                      ...last,
                      sources: data.sources_used,
                    },
                  ];
                }
                return prev;
              });
            }
            if (data.error) {
              setMessages((prev) => [
                ...prev,
                { type: "error", content: data.error },
              ]);
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: "error",
          content:
            "Cannot reach backend. Check your connection and API URL.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", fontFamily: "var(--font-sans)" }}>
      {/* TOP NAV BAR */}
      <div style={{ height: "40px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 16px", gap: "16px", flexShrink: 0 }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--accent-blue)", fontWeight: "600", fontSize: "13px" }}>[·]</span>
          <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "13px" }}>ELLIOT-AI</span>
          <span style={{ color: "var(--accent-green)", fontSize: "10px", background: "rgba(79,255,176,0.1)", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(79,255,176,0.3)" }}>● Connected</span>
        </div>

        {/* Center Status Pills */}
        <div style={{ flex: 1, display: "flex", gap: "12px", justifyContent: "center", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          <span>● Knowledge Base Active</span>
          <span>● Project Context Loaded</span>
          <span>● Git Context Synced</span>
          <span>● Jira Connected</span>
          <span>● RAG Available</span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "var(--text-secondary)" }}>
          <span>elliot-engineer-v2</span>
          <span>·</span>
          <span>staging</span>
          {onReset && (
            <>
              <span>·</span>
              <button
                onClick={onReset}
                style={{ color: "var(--text-muted)", cursor: "pointer", background: "transparent", border: "none", fontSize: "11px", textDecoration: "underline", fontFamily: "var(--font-sans)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--accent-blue)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")}
              >
                Reset (dev)
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* LEFT SIDEBAR */}
        <div style={{ width: "200px", background: "var(--surface)", borderRight: "1px solid var(--border)", overflowY: "auto", padding: "16px 0", fontSize: "12px", flexShrink: 0 }}>
          {/* PROJECT CONTEXT */}
          <div style={{ paddingLeft: "16px", paddingRight: "12px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              PROJECT CONTEXT
            </div>
            <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-primary)", marginBottom: "8px" }}>Payments Platform</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}><span style={{ color: "var(--text-muted)" }}>repository</span> payment-api</div>
            <div style={{ fontSize: "11px", color: "var(--accent-green)", marginBottom: "4px" }}><span style={{ color: "var(--text-muted)" }}>branch</span> feature/refund-flow</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}><span style={{ color: "var(--text-muted)" }}>sprint / team</span> Sprint 42 Core Payments</div>
          </div>

          {/* ACTIVE CONTEXT */}
          <div style={{ paddingLeft: "16px", paddingRight: "12px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              ACTIVE CONTEXT <span style={{ background: "var(--surface-2)", padding: "1px 6px", borderRadius: "3px", marginLeft: "6px" }}>7 loaded</span>
            </div>
            {["Company Standards", "Engineering Playbook", "Client Requirements", "Project Documentation", "Jira Tickets", "Architecture Decisions", "Test Strategy"].map((item) => (
              <div key={item} style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                <span style={{ color: "var(--accent-green)" }}>✓</span> {item}
              </div>
            ))}
          </div>

          {/* MEMORY */}
          <div style={{ paddingLeft: "16px", paddingRight: "12px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
              MEMORY <span style={{ color: "var(--text-muted)" }}>PERSISTENT</span>
            </div>
            {[
              { title: "Coding Standards", desc: "Google TS Style + internal lint" },
              { title: "Team Preferences", desc: "Vitest · 90% gate" },
              { title: "Client Rules", desc: "SOC 2 · PCI-DSS · no PAN in logs" },
            ].map((mem) => (
              <div key={mem.title} style={{ background: "var(--surface-2)", padding: "8px 10px", borderRadius: "4px", marginBottom: "6px", fontSize: "11px" }}>
                <div style={{ color: "var(--text-primary)", fontWeight: "500" }}>{mem.title}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "10px", marginTop: "2px" }}>{mem.desc}</div>
              </div>
            ))}
          </div>

          {/* CONNECTED SOURCES */}
          <div style={{ paddingLeft: "16px", paddingRight: "12px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
              CONNECTED SOURCES <span style={{ background: "var(--surface-2)", padding: "1px 6px", borderRadius: "3px", marginLeft: "6px" }}>9</span>
            </div>
            {["GitHub", "Jira", "Confluence", "Notion", "Slack", "Azure DevOps", "SharePoint"].map((src) => (
              <div key={src} style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                <span><span style={{ color: "var(--accent-green)" }}>●</span> {src}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Scrollable Content */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "32px 40px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.length === 0 ? (
              <>
                {/* ASCII Art */}
                <div
                  style={{
                    fontSize: "9px",
                    fontFamily: "var(--font-mono)",
                    color: "rgba(232,234,240,0.12)",
                    lineHeight: "1.2",
                    marginBottom: "20px",
                    textAlign: "center",
                    whiteSpace: "pre",
                    userSelect: "none",
                  }}
                >
                  {`  ___ _ _ _      _      _   ___
 | __| | (_)___| |_   /_\\ |_ _|
 | _|| | | / _ \\  _| / _ \\ | |
 |___|_|_|_\\___/\\__|/_/ \\_\\___|`}
                </div>

                {/* Welcome Text */}
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                    maxWidth: "700px",
                  }}
                >
                  Organization AI Engineer — connected to your repositories, standards, and knowledge base. I plan, build, test and validate with full context of{" "}
                  <span style={{ color: "var(--accent-blue)" }}>Payments Platform</span>.
                </div>

                {/* Suggestion Chips */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    "create unit tests for the refund service",
                    "/agents",
                    "/context",
                    "/help",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setInput(chip)}
                      style={{
                        background: "transparent",
                        border: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        padding: "5px 12px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                          "var(--accent-blue)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--text-primary)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor =
                          "var(--border)";
                        (e.currentTarget as HTMLButtonElement).style.color =
                          "var(--text-secondary)";
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                    }}
                  >
                    {msg.type === "query" && (
                      <div
                        style={{
                          color: "var(--accent-green)",
                          marginBottom: "4px",
                        }}
                      >
                        › {msg.content}
                      </div>
                    )}
                    {msg.type === "thinking" && (
                      <div style={{ color: "var(--text-muted)" }}>
                        {msg.content}
                      </div>
                    )}
                    {msg.type === "response" && (
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          lineHeight: "1.5",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {msg.content}
                        {msg.sources && (
                          <div
                            style={{
                              marginTop: "12px",
                              paddingTop: "8px",
                              borderTop: "1px solid var(--border)",
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            code({msg.sources.code_chunks || 0}) · jira(
                            {msg.sources.jira_tickets || 0}) · slack(
                            {msg.sources.slack_messages || 0})
                          </div>
                        )}
                      </div>
                    )}
                    {msg.type === "error" && (
                      <div
                        style={{
                          color: "var(--accent-red, #ff7b72)",
                          marginBottom: "4px",
                        }}
                      >
                        ✗ {msg.content}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* INPUT BAR */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                background: "var(--surface-2)",
                borderRadius: "4px",
                border: loading ? "1px solid var(--accent-blue)" : "1px solid var(--border)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <span
                style={{
                  color: loading ? "var(--accent-blue)" : "var(--accent-green)",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                {loading ? "⊙" : "›"}
              </span>
              <input
                autoFocus
                disabled={loading}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={
                  loading
                    ? "Waiting for response..."
                    : "Ask Elliot, or type / for commands"
                }
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono)",
                  cursor: loading ? "not-allowed" : "text",
                }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                {loading ? "streaming..." : "↵ to run"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "6px",
                fontSize: "10px",
                color: "var(--text-muted)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)" }}>
                [commands] [Tab complete] [↑ history]
              </span>
              <span style={{ color: "var(--accent-green)" }}>● RAG context attached</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ width: "220px", background: "var(--surface)", borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "16px", fontSize: "12px", flexShrink: 0 }}>
          {/* AGENT ACTIVITY */}
          <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              AGENT ACTIVITY <span style={{ background: "var(--surface-2)", padding: "1px 6px", borderRadius: "3px", marginLeft: "6px" }}>idle</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Live reasoning and tool calls appear here as Elliot works.</div>
          </div>

          {/* MULTI-AGENT WORKFORCE */}
          <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
              MULTI-AGENT WORKFORCE <span style={{ background: "var(--surface-2)", padding: "1px 6px", borderRadius: "3px", marginLeft: "6px" }}>0/4 engaged</span>
            </div>
            {ELLIOT.AGENTS.map((agent) => (
              <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 0", borderBottom: "1px solid var(--border-soft)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--border)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-secondary)" }}>{agent.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "1px" }}>{agent.role}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CONTEXT WINDOW */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-mono)", display: "flex", justifyContent: "space-between" }}>
              CONTEXT WINDOW <span style={{ fontWeight: "500" }}>21k / 200k</span>
            </div>
            <div style={{ height: "4px", background: "var(--surface-2)", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, var(--accent-blue))", width: "11%" }} />
            </div>
            <div style={{ fontSize: "11px", marginBottom: "6px" }}>
              <div style={{ color: "var(--text-secondary)", marginBottom: "4px" }}>Standards & Playbook <span style={{ float: "right" }}>21k</span></div>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
              <span>11% used</span>
              <span style={{ color: "var(--accent-green)" }}>179k free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
