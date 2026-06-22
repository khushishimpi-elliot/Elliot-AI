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

function getInstallerUrl(os: string) {
  const baseUrl = "https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0";
  const scripts: Record<string, string> = {
    windows: `${baseUrl}/install-windows.ps1`,
    macos: `${baseUrl}/install-unix.sh`,
    linux: `${baseUrl}/install-unix.sh`,
  };
  return scripts[os] || scripts.windows;
}

function detectOS(): "windows" | "macos" | "linux" {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
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
    const os = detectOS();
    const installerUrl = getInstallerUrl(os);

    try {
      if (os === "windows") {
        // Windows: Download and run PowerShell script
        const response = await fetch(installerUrl);
        const scriptContent = await response.text();

        // Create blob and download
        const blob = new Blob([scriptContent], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "install-elliot-ai.ps1";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(
          "Installer downloaded! Run this in PowerShell as Administrator:\n" +
          "Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force\n" +
          ".\\install-elliot-ai.ps1"
        );
      } else {
        // Mac/Linux: Download and run shell script
        const response = await fetch(installerUrl);
        const scriptContent = await response.text();

        const blob = new Blob([scriptContent], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "install-elliot-ai.sh";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(
          "Installer downloaded! Run this in your terminal:\n" +
          "chmod +x install-elliot-ai.sh\n" +
          "./install-elliot-ai.sh"
        );
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download installer. Please visit the GitHub releases page.");
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
            {isInstalling ? "⏳ Downloading..." : "$ Setup & Launch Terminal →"}
          </button>
          <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            Installs CLI and opens terminal
          </span>
        </div>
      )}
    </div>
  );
}
