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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCopySetupCommand = async () => {
    try {
      const command = `elliot setup --token ${fullConfig.jwt_token} --tenant-id ${fullConfig.tenant_id}`;
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          { label: "Stack", value: fullConfig.stack || "—" },
          {
            label: "Standards",
            value: `${fullConfig.test_framework || "—"} · ${fullConfig.coverage_gate || 0}% · ${fullConfig.review_policy || "—"}`,
          },
          { label: "Architecture", value: fullConfig.arch_style || "—" },
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
            }}
          >
            elliot setup --token {fullConfig.jwt_token} --tenant-id {fullConfig.tenant_id}
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

      {/* Copy Button */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={handleCopySetupCommand}
          style={{
            background: copied ? "var(--accent-green)" : "var(--border)",
            color: copied ? "black" : "var(--text-primary)",
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
            !copied && ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")
          }
          onMouseLeave={(e) =>
            !copied && ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
        >
          {copied ? "✓ Copied" : "Copy Setup Command"}
        </button>
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {copied ? "Ready to paste in terminal" : "Copy step 02 command"}
        </span>
      </div>
    </div>
  );
}
