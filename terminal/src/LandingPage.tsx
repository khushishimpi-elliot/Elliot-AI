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
                {tab === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: "24px", fontWeight: "600", marginBottom: "28px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
            {authMode === "signin" ? "Sign in" : "Sign up"}
          </h2>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            {/* Email Field */}
            <input
              type="email"
              placeholder={authMode === "signin" ? "Enter your email" : "Enter your email"}
              style={{
                height: "42px",
                padding: "0 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "5px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />

            {/* Password Field */}
            <div>
              <input
                type="password"
                placeholder={authMode === "signin" ? "Enter your password" : "Create a password"}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "5px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                  marginBottom: authMode === "signin" ? "8px" : "0px",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
              {authMode === "signin" && (
                <a href="#" style={{ fontSize: "12px", fontWeight: "400", color: "var(--accent-blue)", textDecoration: "none", fontFamily: "var(--font-sans)", display: "block", marginTop: "4px" }}>
                  Forgot password?
                </a>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {authMode === "signup" && (
              <input
                type="password"
                placeholder="Confirm your password"
                style={{
                  height: "42px",
                  padding: "0 12px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "5px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              />
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
              borderRadius: "5px",
              fontSize: "14px",
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
            {authMode === "signin" ? "Sign in" : "Sign up"}
          </button>

          {/* Switch Mode Link */}
          <div style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", textAlign: "center", fontFamily: "var(--font-sans)" }}>
            {authMode === "signin" ? (
              <>
                Not onboarded yet?{" "}
                <button
                  onClick={() => setAuthMode("signup")}
                  style={{ color: "var(--accent-blue)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: "400" }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setAuthMode("signin")}
                  style={{ color: "var(--accent-blue)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: "400" }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
