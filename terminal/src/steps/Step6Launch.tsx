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
  const [copiedNpm, setCopiedNpm] = useState(false);
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
        const jwt = localStorage.getItem("jwt") || localStorage.getItem("elliot_token");

        console.log("Step6Launch - Loading config:", { tenantId, jwt, config });
        console.log("Step6Launch - All localStorage:", Object.fromEntries(
          Object.entries(localStorage).filter(([k]) => k.includes("elliot") || k.includes("jwt"))
        ));

        if (!tenantId || !jwt) {
          setError("Setup incomplete — please complete Step 2 (Workspace) before launching.");
          setLoading(false);
          return;
        }

        const configUrl = `${API_URL}/onboarding/config/${tenantId}`;
        console.log("Step6Launch - Fetching from:", configUrl);

        const response = await fetch(
          configUrl,
          {
            headers: {
              Authorization: `Bearer ${jwt}`,
            },
          }
        );

        console.log("Step6Launch - Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Step6Launch - Error response:", errorText);
          throw new Error(`Failed to load configuration: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log("Step6Launch - Config data:", data);
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

  const handleCopySetupCommand = async () => {
    try {
      const command = `elliot setup --token ${fullConfig.jwt_token} --tenant-id ${fullConfig.tenant_id}`;
      await navigator.clipboard.writeText(command);
      setCopiedSetup(true);
      setTimeout(() => setCopiedSetup(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const handleCopyNpmCommand = async () => {
    try {
      await navigator.clipboard.writeText("npm install -g elliot-ai");
      setCopiedNpm(true);
      setTimeout(() => setCopiedNpm(false), 2000);
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

      {/* Install CLI Section */}
      <div
        style={{
          background: "#141414",
          border: "1px solid #1E1E1E",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            color: "#FFFFFF",
            fontFamily: "monospace",
            fontSize: "14px",
            fontWeight: "bold",
            margin: "0 0 4px 0",
          }}
        >
          Install Elliot-AI CLI
        </p>
        <p
          style={{
            color: "#AAAAAA",
            fontFamily: "monospace",
            fontSize: "12px",
            margin: "0 0 16px 0",
          }}
        >
          Available on npm — works on Mac, Windows, and Linux
        </p>

        {/* npm install command */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0D0D0D",
            border: "1px solid #333333",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "12px",
          }}
        >
          <code
            style={{
              color: "#4FFFB0",
              fontFamily: "monospace",
              fontSize: "13px",
            }}
          >
            npm install -g elliot-ai
          </code>
          <button
            onClick={handleCopyNpmCommand}
            style={{
              background: "transparent",
              border: "none",
              color: copiedNpm ? "#4FFFB0" : "#666666",
              fontFamily: "monospace",
              fontSize: "11px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            {copiedNpm ? "✓ Copied" : "Copy"}
          </button>
        </div>

        {/* Help text and link */}
        <p
          style={{
            color: "#666666",
            fontSize: "11px",
            fontFamily: "monospace",
            margin: "0",
          }}
        >
          Requires Node.js 18+ · {" "}
          <a
            href="https://www.npmjs.com/package/elliot-ai"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#888888", textDecoration: "none" }}
          >
            View package on npm →
          </a>
        </p>
      </div>

      {/* Setup Steps */}
      <div style={{ marginBottom: "28px" }}>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "16px",
            fontFamily: "var(--font-sans)",
          }}
        >
          Set up your CLI
        </h3>

        {/* Step 1: Install */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "500",
              color: "var(--text-muted)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            01 · Install
          </div>
          <div
            style={{
              background: "#0D0D0D",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "12px 16px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--accent-green)",
              overflow: "auto",
            }}
          >
            npm install -g elliot-ai
          </div>
        </div>

        {/* Step 2: Configure */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "500",
              color: "var(--text-muted)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            02 · Configure
          </div>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Run this command to automatically configure Elliot with your
            workspace settings:
          </p>
          <div
            style={{
              background: "#0D0D0D",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "12px 16px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--accent-green)",
              overflow: "auto",
              wordBreak: "break-all",
              marginBottom: "8px",
            }}
          >
            elliot setup --token {fullConfig.jwt_token} --tenant-id{" "}
            {fullConfig.tenant_id}
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleCopySetupCommand}
              style={{
                background: copiedSetup ? "var(--accent-green)" : "var(--border)",
                color: copiedSetup ? "black" : "var(--text-primary)",
                border: "none",
                borderRadius: "5px",
                fontSize: "13px",
                fontWeight: "600",
                padding: "8px 16px",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) =>
                !copiedSetup &&
                ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")
              }
              onMouseLeave={(e) =>
                !copiedSetup &&
                ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
              }
            >
              {copiedSetup ? "✓ Copied" : "📋 Copy setup command"}
            </button>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {copiedSetup ? "Ready to paste in terminal" : ""}
            </span>
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            ⚠️ This token is unique to you. Do not share it.
          </div>
        </div>

        {/* Step 3: Start */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "500",
              color: "var(--text-muted)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            03 · Start
          </div>
          <div
            style={{
              background: "#0D0D0D",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "12px 16px",
              fontFamily: "var(--font-mono)",
              fontSize: "13px",
              color: "var(--accent-green)",
            }}
          >
            elliot
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginTop: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Opens the interactive terminal. Ask anything about your codebase.
          </div>
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
