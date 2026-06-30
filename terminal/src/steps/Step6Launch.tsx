import { useState, useEffect } from "react";

interface OnboardingConfig {
  jwt_token?: string;
  tenant_id?: string;
  user_id?: string;
  org_name?: string;
  stack?: string;
  arch_style?: string;
  test_framework?: string;
  coverage_gate?: number;
  review_policy?: string;
  ci_cd_platform?: string;
  connectors?: Array<{ provider: string; status: string }>;
  chunk_count?: number;
}

interface Step6Props {
  config?: OnboardingConfig;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Step6Launch({ config = {} }: Step6Props) {
  const [fullConfig, setFullConfig] = useState<OnboardingConfig>({});
  const [loading, setLoading] = useState(true);
  const [copiedSetup, setCopiedSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read from localStorage for stack, test, etc
  const stack = localStorage.getItem("elliot_stack") || "—";
  const testFramework = localStorage.getItem("elliot_test_framework") || "—";
  const coverageGate = localStorage.getItem("elliot_coverage_gate") || "0";
  const reviewPolicy = localStorage.getItem("elliot_review_policy") || "—";
  const branchingModel = localStorage.getItem("elliot_branching_model") || "—";

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const tenantId = localStorage.getItem("elliot_tenant_id") || config.tenant_id;
        const jwt = localStorage.getItem("jwt");

        if (!tenantId || !jwt) {
          setError("Missing configuration. Please restart onboarding.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/onboarding/config/${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load configuration");
        }

        const data = await response.json();
        setFullConfig(data);
      } catch (err) {
        console.error("Error fetching config:", err);
        setError("Failed to load your configuration");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [config]);

  // One global command: installs the CLI and configures it with this user's
  // workspace in a single paste. `setup` derives tenant_id from the JWT, so no
  // separate --tenant-id flag is needed.
  const setupCommand = `npm install -g elliot-ai && elliot-ai setup --token ${fullConfig.jwt_token}`;

  const handleCopySetupCommand = async () => {
    try {
      await navigator.clipboard.writeText(setupCommand);
      setCopiedSetup(true);
      setTimeout(() => setCopiedSetup(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const connectedCount =
    fullConfig.connectors?.filter((c) => c.status === "connected").length || 0;

  if (loading) {
    return (
      <div style={{ color: "var(--text-secondary)" }}>
        Loading your configuration...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "var(--accent-red, #ff7b72)" }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "500",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--accent-blue)",
            fontFamily: "var(--font-sans)",
            marginBottom: "12px",
          }}
        >
          SETUP COMPLETE · STEP 6 OF 6
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "var(--text-primary)",
            marginBottom: "12px",
            fontFamily: "var(--font-sans)",
          }}
        >
          Elliot-AI is ready
        </h1>
        <p
          style={{
            fontSize: "14px",
            fontWeight: "400",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            fontFamily: "var(--font-sans)",
          }}
        >
          Your organization's knowledge, repositories and engineering standards
          are live. Elliot now operates with full context.
        </p>
      </div>

      {/* Green Checkmark */}
      <div
        style={{
          width: "52px",
          height: "52px",
          background: "rgba(79,255,176,0.08)",
          border: "1px solid rgba(79,255,176,0.3)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          color: "var(--accent-green)",
          fontWeight: "700",
          marginBottom: "24px",
        }}
      >
        ✓
      </div>

      {/* Summary Table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          overflow: "hidden",
          maxWidth: "540px",
          marginBottom: "28px",
        }}
      >
        {[
          { label: "Organization", value: fullConfig.org_name || "—" },
          { label: "Stack", value: stack },
          {
            label: "Standards",
            value: `${testFramework} · ${coverageGate}% · ${reviewPolicy}`,
          },
          { label: "Architecture", value: branchingModel },
          {
            label: "Connected",
            value: `${connectedCount} sources · ${fullConfig.chunk_count?.toLocaleString() || 0} chunks`,
          },
        ].map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              padding: "11px 18px",
              borderBottom: i < 4 ? "1px solid var(--border)" : "none",
              background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: "400",
                color: "var(--text-muted)",
                width: "130px",
                fontFamily: "var(--font-sans)",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "500",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Set up Elliot-AI — one global command */}
      <div style={{ marginBottom: "28px" }}>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "8px",
            fontFamily: "var(--font-sans)",
          }}
        >
          Set up the Elliot-AI CLI
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginBottom: "16px",
            maxWidth: "540px",
            fontFamily: "var(--font-sans)",
          }}
        >
          Run this one command in your terminal — it installs the CLI and
          configures it with your workspace in a single step. Works on macOS,
          Windows, and Linux (requires Node.js 18+).
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            background: "#0D0D0D",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "12px 16px",
            maxWidth: "540px",
          }}
        >
          <code
            style={{
              color: "var(--accent-green)",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {setupCommand}
          </code>
          <button
            onClick={handleCopySetupCommand}
            style={{
              flexShrink: 0,
              background: copiedSetup ? "var(--accent-green)" : "var(--border)",
              color: copiedSetup ? "black" : "var(--text-primary)",
              border: "none",
              borderRadius: "5px",
              fontSize: "12px",
              fontWeight: "600",
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              transition: "all 0.15s ease",
            }}
          >
            {copiedSetup ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <div
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "8px",
            maxWidth: "540px",
            fontFamily: "var(--font-sans)",
          }}
        >
          ⚠️ This token is unique to you. Do not share it. Once setup finishes,
          run{" "}
          <code
            style={{ color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}
          >
            elliot-ai
          </code>{" "}
          to start the interactive terminal.
        </div>
      </div>

      {/* Launch Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "32px",
        }}
      >
        <button
          onClick={() => {
            const currentUrl = window.location.href;
            const terminalUrl = currentUrl.replace(/\/onboarding.*/, "/terminal");
            window.location.href = terminalUrl;
          }}
          style={{
            flex: 1,
            background: "#4FFFB0",
            color: "#000000",
            border: "none",
            padding: "14px",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontWeight: "bold",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Open web terminal →
        </button>

        <button
          onClick={() => {
            window.open("https://elliot-ai.onrender.com/dashboard", "_blank");
          }}
          style={{
            flex: 1,
            background: "transparent",
            color: "#AAAAAA",
            border: "1px solid #333333",
            padding: "14px",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Open dashboard →
        </button>
      </div>
    </div>
  );
}
