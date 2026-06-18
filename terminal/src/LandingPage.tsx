interface LandingPageProps {
  onSignIn: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const handleSignIn = () => {
    onSignIn();
  };

  const handleOAuthClick = () => {
    onSignIn();
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-canvas)" }}>
      {/* LEFT PANEL */}
      <div style={{ flex: "0 0 40%", background: "#0D0D0D", padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "var(--accent-indigo)", fontFamily: "var(--mono)", fontSize: "16px", fontWeight: "bold" }}>[·]</span>
          <span style={{ color: "var(--text-primary)", fontFamily: "var(--mono)", fontSize: "14px", fontWeight: "700" }}>ELLIOT-AI</span>
        </div>

        {/* Center Content */}
        <div>
          <h1 style={{ fontSize: "32px", lineHeight: "1.2", marginBottom: "16px", color: "var(--text-primary)", fontFamily: "var(--mono)", fontWeight: "700" }}>
            The organization's
            <br />
            <span style={{ color: "var(--accent-indigo)" }}>AI engineer.</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", marginBottom: "32px", maxWidth: "400px", fontFamily: "var(--mono)" }}>
            One terminal for your repositories, standards, tickets and knowledge — operated by specialized agents that ship to your conventions.
          </p>

          {/* Terminal Demo Box */}
          <div style={{ background: "#111318", border: "1px solid var(--border-default)", borderRadius: "4px", padding: "16px", marginBottom: "32px", fontFamily: "var(--mono)", fontSize: "12px", lineHeight: "1.6" }}>
            <div style={{ color: "var(--accent-green)", marginBottom: "4px" }}>$ elliot auth --sso okta</div>
            <div style={{ color: "var(--accent-green)" }}>✓ identity verified · core-payments.okta.com</div>
            <div style={{ color: "var(--accent-green)" }}>✓ workspace: Payments Platform</div>
            <div style={{ color: "var(--accent-indigo)" }}>→ 9 sources synced · 504k chunks ready</div>
          </div>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {["SOC 2 Type II", "SSO / SCIM", "Self-hosted option", "No training on your code"].map((benefit) => (
              <div key={benefit} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--mono)" }}>
                <span style={{ color: "var(--accent-green)" }}>●</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Placeholder */}
        <div />
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: "0 0 60%", background: "#111318", padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ maxWidth: "420px", marginLeft: "auto", marginRight: "auto", width: "100%" }}>
          {/* Sign In Heading */}
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--mono)" }}>
            Sign in
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px", fontFamily: "var(--mono)" }}>
            Welcome back. Authenticate to open your workspace.
          </p>

          {/* SSO Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            {[
              { icon: "O", label: "Continue with Okta" },
              { icon: "E", label: "Continue with Microsoft Entra" },
              { icon: "G", label: "Continue with Google Workspace" },
            ].map((btn) => (
              <button
                key={btn.icon}
                onClick={handleOAuthClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "#1a1d27",
                  border: "1px solid var(--border-default)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--mono)",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1f2330";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-indigo)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1a1d27";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-default)";
                }}
              >
                <span style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#2a2d3a", borderRadius: "4px", fontSize: "13px", fontWeight: "700" }}>
                  {btn.icon}
                </span>
                <span style={{ flex: 1 }}>{btn.label}</span>
                <span>→</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ textAlign: "center", margin: "24px 0", position: "relative" }}>
            <div style={{ borderTop: "1px solid var(--border-default)" }} />
            <span style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#111318", padding: "0 8px", color: "var(--text-muted)", fontSize: "12px", fontFamily: "var(--mono)" }}>
              or sign in with email
            </span>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "WORKSPACE", placeholder: "elliot-ai.cloud/ core-payments" },
              { label: "WORK EMAIL", placeholder: "you@core-payments.com" },
              { label: "PASSWORD", placeholder: "Enter your password", type: "password" },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ display: "block", fontSize: "10px", fontWeight: "700", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--mono)" }}>
                  {field.label}
                  {field.label === "PASSWORD" && (
                    <span style={{ marginLeft: "auto", display: "flex", justifyContent: "flex-end" }}>
                      <a href="#" style={{ color: "var(--accent-indigo)", textDecoration: "none", fontSize: "11px" }}>
                        Forgot?
                      </a>
                    </span>
                  )}
                </label>
                <input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    background: "#1a1d27",
                    border: "1px solid var(--border-default)",
                    borderRadius: "4px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--mono)",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-indigo)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                  }}
                />
              </div>
            ))}
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "var(--accent-indigo)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontFamily: "var(--mono)",
              fontWeight: "700",
              cursor: "pointer",
              marginBottom: "12px",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            }}
          >
            Sign in →
          </button>

          {/* Create Workspace Link */}
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--mono)", textAlign: "center", marginBottom: "24px" }}>
            New organization?{" "}
            <a href="#" style={{ color: "var(--accent-indigo)", textDecoration: "none" }}>
              Create a workspace →
            </a>
          </div>

          {/* Bottom Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
            <span style={{ color: "var(--accent-green)" }}>●</span>
            Protected by enterprise SSO · device trust · audit logging
          </div>
        </div>
      </div>
    </div>
  );
}
