interface LandingPageProps {
  authMode: "signin" | "signup";
  setAuthMode: (mode: "signin" | "signup") => void;
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ authMode, setAuthMode, onSignIn, onSignUp }: LandingPageProps) {
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
            {authMode === "signin" ? (
              <>
                <div style={{ color: "var(--text-primary)", marginBottom: "4px" }}>$ elliot auth --sso okta</div>
                <div style={{ color: "var(--accent-green)", marginBottom: "2px" }}>✓ identity verified · core-payments.okta.com</div>
                <div style={{ color: "var(--accent-green)", marginBottom: "2px" }}>✓ workspace: Payments Platform</div>
                <div style={{ color: "var(--accent-blue)" }}>→ 9 sources synced · 504k chunks ready</div>
              </>
            ) : (
              <>
                <div style={{ color: "var(--text-primary)", marginBottom: "4px" }}>$ elliot init --new-workspace</div>
                <div style={{ color: "var(--text-primary)", marginBottom: "2px" }}>→ provisioning tenant...</div>
                <div style={{ color: "var(--text-primary)", marginBottom: "2px" }}>→ setting up knowledge index...</div>
                <div style={{ color: "var(--accent-green)" }}>✓ workspace ready</div>
              </>
            )}
          </div>

          {/* Benefits Row */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {(authMode === "signin"
              ? ["SOC 2 Type II", "SSO / SCIM", "Self-hosted option", "No training on your code"]
              : ["No training on your code", "SOC 2 Type II", "encrypted at rest", "Self-hosted option"]
            ).map((benefit) => (
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
          {/* Tab Switcher */}
          <div style={{ background: "#1a1d27", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px", display: "inline-flex", gap: "4px", marginBottom: "28px" }}>
            {["signin", "signup"].map((tab) => (
              <button
                key={tab}
                onClick={() => setAuthMode(tab as "signin" | "signup")}
                style={{
                  background: authMode === tab ? "var(--surface)" : "transparent",
                  border: authMode === tab ? "1px solid var(--border)" : "none",
                  color: authMode === tab ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: authMode === tab ? "500" : "400",
                  padding: "7px 20px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (authMode !== tab) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (authMode !== tab) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                  }
                }}
              >
                {tab === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "6px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
            {authMode === "signin" ? "Sign in" : "Create your workspace"}
          </h2>
          <p style={{ fontSize: "14px", fontWeight: "400", marginBottom: "28px", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
            {authMode === "signin"
              ? "Welcome back. Authenticate to open your workspace."
              : "Set up Elliot-AI for your organization. Takes about 3 minutes."}
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
                onClick={authMode === "signin" ? onSignIn : onSignUp}
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
              {authMode === "signin" ? "or sign in with email" : "or sign up with email"}
            </span>
          </div>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {authMode === "signin" ? (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
                    Workspace
                  </label>
                  <div style={{ display: "flex", alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", height: "40px", paddingLeft: "12px" }}>
                    <span style={{ color: "var(--text-muted)", fontSize: "14px", marginRight: "4px", fontFamily: "var(--font-sans)" }}>elliot-ai.cloud/</span>
                    <input placeholder="your-workspace" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", paddingRight: "12px" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
                    Work Email
                  </label>
                  <input placeholder="you@company.com" style={{ width: "100%", height: "40px", padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                      Password
                    </label>
                    <a href="#" style={{ fontSize: "11px", color: "var(--accent-blue)", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                      Forgot?
                    </a>
                  </div>
                  <input type="password" placeholder="Enter your password" style={{ width: "100%", height: "40px", padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", outline: "none" }} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
                    Work Email
                  </label>
                  <input placeholder="you@company.com" style={{ width: "100%", height: "40px", padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
                    Password
                  </label>
                  <input type="password" placeholder="Create a password" style={{ width: "100%", height: "40px", padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", outline: "none" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
                    Confirm Password
                  </label>
                  <input type="password" placeholder="Confirm your password" style={{ width: "100%", height: "40px", padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", outline: "none" }} />
                </div>
              </>
            )}
          </div>

          {/* Main Button */}
          <button
            onClick={authMode === "signin" ? onSignIn : onSignUp}
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
            {authMode === "signin" ? "Sign in →" : "Create account →"}
          </button>

          {/* Switch Mode Link */}
          <div style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", textAlign: "center", marginBottom: "20px", fontFamily: "var(--font-sans)" }}>
            {authMode === "signin" ? (
              <>
                New here?{" "}
                <a href="#" onClick={() => setAuthMode("signup")} style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
                  Create an account →
                </a>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a href="#" onClick={() => setAuthMode("signin")} style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
                  Sign in →
                </a>
              </>
            )}
          </div>

          {/* Security Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
            <span style={{ color: "var(--accent-green)", fontSize: "6px" }}>●</span>
            {authMode === "signin"
              ? "Protected by enterprise SSO · device trust · audit logging"
              : "No training on your code · SOC 2 Type II · encrypted at rest"}
          </div>
        </div>
      </div>
    </div>
  );
}
