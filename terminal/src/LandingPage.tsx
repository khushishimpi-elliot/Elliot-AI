interface LandingPageProps {
  onSignIn: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      {/* LEFT PANEL — 42% width */}
      <div style={{ flex: "0 0 42%", background: "var(--bg)", padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-sans)" }}>
          <span style={{ color: "var(--accent-blue)", fontWeight: "600", fontSize: "14px" }}>[·]</span>
          <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "14px" }}>ELLIOT-AI</span>
        </div>

        {/* Center Content */}
        <div>
          {/* Headline */}
          <h1 style={{ fontSize: "42px", fontWeight: "700", lineHeight: "1.15", marginBottom: "16px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
            The organization's
            <br />
            <span style={{ color: "var(--accent-blue)" }}>AI engineer.</span>
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: "15px", fontWeight: "400", lineHeight: "1.6", color: "var(--text-secondary)", marginBottom: "32px", maxWidth: "360px", fontFamily: "var(--font-sans)" }}>
            One terminal for your repositories, standards, tickets and knowledge — operated by specialized agents that ship to your conventions.
          </p>

          {/* Terminal Demo Box */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "16px 20px", marginBottom: "32px", fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: "1.6" }}>
            <div style={{ color: "var(--text-primary)", marginBottom: "4px" }}>$ elliot auth --sso okta</div>
            <div style={{ color: "var(--accent-green)", marginBottom: "2px" }}>✓ identity verified · core-payments.okta.com</div>
            <div style={{ color: "var(--accent-green)", marginBottom: "2px" }}>✓ workspace: Payments Platform</div>
            <div style={{ color: "var(--accent-blue)" }}>→ 9 sources synced · 504k chunks ready</div>
          </div>

          {/* Benefits Row */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {["SOC 2 Type II", "SSO / SCIM", "Self-hosted option", "No training on your code"].map((benefit) => (
              <div key={benefit} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "400", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                <span style={{ color: "var(--accent-green)", fontSize: "6px" }}>●</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Spacer */}
        <div />
      </div>

      {/* RIGHT PANEL — 58% width */}
      <div style={{ flex: "0 0 58%", background: "var(--surface)", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ maxWidth: "420px", width: "100%" }}>
          {/* Heading */}
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
            Sign in
          </h2>
          <p style={{ fontSize: "14px", fontWeight: "400", marginBottom: "28px", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
            Welcome back. Authenticate to open your workspace.
          </p>

          {/* SSO Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {[
              { icon: "O", name: "Continue with Okta", proto: "SAML / SCIM" },
              { icon: "E", name: "Continue with Microsoft Entra", proto: "Azure AD" },
              { icon: "G", name: "Continue with Google Workspace", proto: "OIDC" },
            ].map((btn) => (
              <button
                key={btn.icon}
                onClick={onSignIn}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  minHeight: "48px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-blue)";
                  (e.currentTarget as HTMLButtonElement).style.background = "#1e2235";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)";
                }}
              >
                <span style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#2a2d3a", borderRadius: "6px", fontSize: "12px", fontWeight: "700", color: "white", fontFamily: "var(--font-mono)" }}>
                  {btn.icon}
                </span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)" }}>{btn.name}</div>
                  <div style={{ fontSize: "12px", fontWeight: "400", color: "var(--text-muted)", marginTop: "2px" }}>{btn.proto}</div>
                </div>
                <span style={{ color: "var(--text-muted)" }}>→</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ position: "relative", margin: "20px 0" }}>
            <div style={{ height: "1px", background: "var(--border)" }} />
            <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "var(--surface)", padding: "0 8px", fontSize: "12px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
              or sign in with email
            </span>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "WORKSPACE", placeholder: "elliot-ai.cloud/ core-payments" },
              { label: "WORK EMAIL", placeholder: "you@core-payments.com" },
              { label: "PASSWORD", type: "password", placeholder: "Enter your password", forgot: true },
            ].map((field) => (
              <div key={field.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                    {field.label}
                  </label>
                  {field.forgot && (
                    <a href="#" style={{ fontSize: "11px", color: "var(--accent-blue)", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                      Forgot?
                    </a>
                  )}
                </div>
                <input
                  type={("type" in field && field.type) || "text"}
                  placeholder={field.placeholder}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "5px",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-sans)",
                    fontSize: "14px",
                    fontWeight: "400",
                    outline: "none",
                    transition: "border-color 0.15s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-blue)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                />
              </div>
            ))}
          </div>

          {/* Sign In Button */}
          <button
            onClick={onSignIn}
            style={{
              width: "100%",
              height: "44px",
              background: "var(--accent-blue)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "16px",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-sans)",
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

          {/* Create Workspace */}
          <div style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", textAlign: "center", marginBottom: "20px", fontFamily: "var(--font-sans)" }}>
            New organization?{" "}
            <a href="#" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
              Create a workspace →
            </a>
          </div>

          {/* Security Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            <span style={{ color: "var(--accent-green)", fontSize: "6px" }}>●</span>
            Protected by enterprise SSO · device trust · audit logging
          </div>
        </div>
      </div>
    </div>
  );
}
