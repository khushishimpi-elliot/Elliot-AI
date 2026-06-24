
interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  const handleSignIn = () => {
    if (localStorage.getItem("elliot_onboarded") === "true") {
      window.location.href = "https://elliot-ai-1.onrender.com";
    } else {
      onSignIn();
    }
  };

  const handleCreateWorkspace = () => {
    onSignUp();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* TOP NAV */}
      <div style={{ padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-sans)" }}>
          <span style={{ color: "var(--accent-blue)", fontWeight: "600", fontSize: "14px" }}>[·]</span>
          <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "14px" }}>ELLIOT-AI</span>
        </div>
      </div>

      {/* CENTERED HERO SECTION */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 48px" }}>
        <div style={{ maxWidth: "680px", width: "100%", textAlign: "center" }}>
          {/* Headline */}
          <h1 style={{ fontSize: "52px", fontWeight: "700", lineHeight: "1.15", marginBottom: "20px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
            The organization's
            <br />
            <span style={{ color: "var(--accent-blue)" }}>AI engineer.</span>
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: "16px", fontWeight: "400", lineHeight: "1.6", color: "var(--text-secondary)", marginBottom: "40px", fontFamily: "var(--font-sans)" }}>
            One terminal for your repositories, standards, tickets and knowledge — operated by specialized agents that ship to your conventions.
          </p>

          {/* Terminal Demo Box */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px 24px", marginBottom: "40px", fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "1.6" }}>
            <div style={{ color: "var(--text-primary)", marginBottom: "4px" }}>$ elliot auth --sso okta</div>
            <div style={{ color: "var(--accent-green)", marginBottom: "2px" }}>✓ identity verified · core-payments.okta.com</div>
            <div style={{ color: "var(--accent-green)", marginBottom: "2px" }}>✓ workspace: Payments Platform</div>
            <div style={{ color: "var(--accent-blue)" }}>→ 9 sources synced · 504k chunks ready</div>
          </div>

          {/* Benefits Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "48px" }}>
            {["SOC 2 Type II", "SSO / SCIM", "Self-hosted option", "No training on your code"].map((benefit) => (
              <div key={benefit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                <span style={{ color: "var(--accent-green)", fontSize: "6px" }}>●</span>
                {benefit}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={handleSignIn}
              style={{
                paddingLeft: "32px",
                paddingRight: "32px",
                height: "48px",
                background: "var(--accent-blue)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
            >
              Sign in
            </button>
            <button
              onClick={handleCreateWorkspace}
              style={{
                paddingLeft: "32px",
                paddingRight: "32px",
                height: "48px",
                background: "transparent",
                color: "var(--accent-blue)",
                border: "1px solid var(--accent-blue)",
                borderRadius: "6px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(67, 97, 238, 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              Create a workspace
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "24px 48px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "center", gap: "16px" }}>
        <span style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>● Protected by enterprise SSO</span>
        <span style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>● device trust</span>
        <span style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>● audit logging</span>
      </div>
    </div>
  );
}
