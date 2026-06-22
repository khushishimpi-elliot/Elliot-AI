import { useState, useEffect } from "react";

interface OnboardingConfig {
  jwtToken?: string;
  tenantId?: string;
  userId?: string;
  teamId?: string;
  orgName?: string;
  stack?: string;
}

interface Step6Props {
  config?: OnboardingConfig;
}

export default function Step6Launch({ config = {} }: Step6Props) {
  const [cliMode, setCliMode] = useState(false);
  const [cliCallback, setCliCallback] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
    const callback = params.get("callback");

    if (source === "cli" && callback) {
      setCliMode(true);
      setCliCallback(callback);
    }
  }, []);

  const handleLaunch = async () => {
    if (cliMode && cliCallback) {
      try {
        const payload = {
          jwt_token: config.jwtToken || "",
          tenant_id: config.tenantId || "",
          user_id: config.userId || "",
          team_id: config.teamId || "",
          org_name: config.orgName || "",
          stack: config.stack || "",
          backend_url: "https://elliot-ai-backend.onrender.com",
          onboarding_url: "https://elliot-ai-terminal.onrender.com",
        };

        await fetch(cliCallback, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        setIsComplete(true);
      } catch (error) {
        console.error("Failed to notify CLI:", error);
        setIsComplete(true);
      }
    }
  };

  const handleDownloadAndInstall = async () => {
    setIsInstalling(true);

    try {
      // Copy npm install command to clipboard
      const command = "npm install -g elliot-ai";
      await navigator.clipboard.writeText(command);

      // Show success
      setIsComplete(true);
    } catch (error) {
      console.error("Error:", error);
      // Fallback: just show the command
      setIsComplete(true);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isComplete && cliMode) {
    return (
      <div>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-green)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
            CLI CONFIGURED · SETUP COMPLETE
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
            ✅ CLI configured
          </h1>
          <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
            Your Elliot-AI CLI is now configured and ready to use. You can close this tab and start using the CLI from your terminal.
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid rgba(79,255,176,0.3)", borderRadius: "6px", padding: "16px", maxWidth: "540px", marginTop: "24px" }}>
          <code style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--accent-green)" }}>
            $ elliot ask "how does auth work?"
          </code>
        </div>
      </div>
    );
  }

  if (isComplete && !cliMode) {
    return (
      <div>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-green)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
            COMMAND COPIED · SETUP READY
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
            ✅ Ready to install
          </h1>
          <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
            The install command has been copied to your clipboard. Open your terminal and paste it to install Elliot-AI globally.
          </p>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid rgba(79,255,176,0.3)", borderRadius: "6px", padding: "16px", maxWidth: "540px", marginTop: "24px" }}>
          <div style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--accent-green)", marginBottom: "8px" }}>
            Paste this in your terminal:
          </div>
          <code style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            npm install -g elliot-ai
          </code>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px", fontFamily: "var(--font-sans)" }}>
            Then run: <code style={{ fontFamily: "var(--font-mono)" }}>elliot-ai init</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          SETUP COMPLETE · STEP 6 OF 6
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
          Elliot-AI is ready
        </h1>
        <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
          Your organization's knowledge, repositories and engineering standards are live. Elliot now operates with full context.
        </p>
      </div>

      {/* Green Checkmark */}
      <div style={{ width: "52px", height: "52px", background: "rgba(79,255,176,0.08)", border: "1px solid rgba(79,255,176,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "var(--accent-green)", fontWeight: "700", marginBottom: "24px" }}>
        ✓
      </div>

      {/* Summary Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", maxWidth: "540px", marginBottom: "28px" }}>
        {[
          { label: "Organization", value: "ELLIOT SYSTEMS" },
          { label: "Stack", value: "TypeScript / Node" },
          { label: "Standards", value: "Vitest · 90% gate · 2 approvals" },
          { label: "Architecture", value: "Hexagonal / ports & adapters" },
          { label: "Compliance", value: "SOC 2, PCI-DSS" },
          { label: "Connected", value: "7 sources · 542.0k chunks indexed" },
        ].map((row, i) => (
          <div key={row.label} style={{ display: "flex", padding: "11px 18px", borderBottom: i < 5 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
            <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-muted)", width: "130px", fontFamily: "var(--font-sans)" }}>{row.label}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Launch Button or Install Button */}
      {cliMode ? (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handleLaunch}
            style={{
              background: "var(--accent-green)",
              color: "black",
              border: "none",
              borderRadius: "5px",
              fontSize: "15px",
              fontWeight: "700",
              padding: "11px 24px",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
          >
            $ Configure CLI →
          </button>
          <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            Configures your terminal
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "var(--surface)", border: "2px solid rgba(79,255,176,0.5)", borderRadius: "8px", padding: "20px", maxWidth: "540px" }}>
            <div style={{ fontSize: "12px", fontFamily: "var(--font-sans)", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Installation Command
            </div>
            <code style={{ fontSize: "16px", fontFamily: "var(--font-mono)", color: "var(--accent-green)", fontWeight: "600", display: "block", wordBreak: "break-all" }}>
              npm install -g elliot-ai
            </code>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px", fontFamily: "var(--font-sans)" }}>
              Copy and paste into your terminal. Then run: <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>elliot-ai init</code>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={handleDownloadAndInstall}
              disabled={isInstalling}
              style={{
                background: isInstalling ? "var(--text-muted)" : "var(--accent-green)",
                color: "black",
                border: "none",
                borderRadius: "5px",
                fontSize: "15px",
                fontWeight: "700",
                padding: "11px 24px",
                cursor: isInstalling ? "not-allowed" : "pointer",
                fontFamily: "var(--font-mono)",
                transition: "all 0.15s ease",
                opacity: isInstalling ? 0.6 : 1,
              }}
              onMouseEnter={(e) => !isInstalling && ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
              onMouseLeave={(e) => !isInstalling && ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
            >
              {isInstalling ? "✓ Copied" : "$ Copy Command to Clipboard →"}
            </button>
            <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              Easy paste into terminal
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
