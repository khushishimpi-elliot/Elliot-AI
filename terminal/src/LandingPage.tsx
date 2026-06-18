import { useState } from "react";

interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export default function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  const [showDevSignup, setShowDevSignup] = useState(false);

  const handleDevSignIn = () => {
    if (localStorage.getItem("elliot_onboarded") === "true") {
      window.location.href = "https://elliot-ai-terminal.onrender.com";
    } else {
      onSignIn();
    }
  };

  const handleDevSignUp = () => {
    onSignUp();
  };

  const handleTeamLeadSignIn = () => {
    window.location.href = "https://elliot-ai-dashboard.onrender.com";
  };

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
      <div style={{ flex: "0 0 58%", background: "var(--surface)", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", overflowY: "auto" }}>
        <div style={{ maxWidth: "420px", width: "100%" }}>
          {/* DEVELOPER CARD */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
              Developer
            </div>

            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px", marginBottom: "20px" }}>
              {showDevSignup ? (
                // SIGN UP VIEW
                <>
                  <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                    Sign up
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      style={{
                        height: "42px",
                        padding: "0 12px",
                        background: "var(--surface)",
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
                    <input
                      type="password"
                      placeholder="Create a password"
                      style={{
                        height: "42px",
                        padding: "0 12px",
                        background: "var(--surface)",
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
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      style={{
                        height: "42px",
                        padding: "0 12px",
                        background: "var(--surface)",
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
                  </div>

                  <button
                    onClick={handleDevSignUp}
                    style={{
                      width: "100%",
                      height: "42px",
                      background: "var(--accent-blue)",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginBottom: "12px",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-sans)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                  >
                    Sign up
                  </button>

                  <div style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", textAlign: "center", fontFamily: "var(--font-sans)" }}>
                    Already have an account?{" "}
                    <button
                      onClick={() => setShowDevSignup(false)}
                      style={{ color: "var(--accent-blue)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: "400" }}
                    >
                      Sign in
                    </button>
                  </div>
                </>
              ) : (
                // SIGN IN VIEW
                <>
                  <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                    Sign in
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      style={{
                        height: "42px",
                        padding: "0 12px",
                        background: "var(--surface)",
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
                    <input
                      type="password"
                      placeholder="Enter your password"
                      style={{
                        height: "42px",
                        padding: "0 12px",
                        background: "var(--surface)",
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
                  </div>

                  <a href="#" style={{ fontSize: "12px", fontWeight: "400", color: "var(--accent-blue)", textDecoration: "none", fontFamily: "var(--font-sans)", display: "block", marginBottom: "12px", marginTop: "-6px" }}>
                    Forgot password?
                  </a>

                  <button
                    onClick={handleDevSignIn}
                    style={{
                      width: "100%",
                      height: "42px",
                      background: "var(--accent-blue)",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      marginBottom: "12px",
                      transition: "all 0.15s ease",
                      fontFamily: "var(--font-sans)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
                  >
                    Sign in
                  </button>

                  <div style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", textAlign: "center", fontFamily: "var(--font-sans)" }}>
                    Not onboarded yet?{" "}
                    <button
                      onClick={() => setShowDevSignup(true)}
                      style={{ color: "var(--accent-blue)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: "400" }}
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* DIVIDER */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0", fontFamily: "var(--font-sans)" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "11px", fontWeight: "400", color: "var(--text-muted)", whiteSpace: "nowrap" }}>or continue as team lead</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* TEAM LEAD CARD */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
              Team Lead
            </div>

            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderLeft: "2px solid var(--accent-blue)", borderRadius: "8px", padding: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                Sign in
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    background: "var(--surface)",
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
                <input
                  type="password"
                  placeholder="Enter your password"
                  style={{
                    height: "42px",
                    padding: "0 12px",
                    background: "var(--surface)",
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
              </div>

              <a href="#" style={{ fontSize: "12px", fontWeight: "400", color: "var(--accent-blue)", textDecoration: "none", fontFamily: "var(--font-sans)", display: "block", marginBottom: "12px", marginTop: "-6px" }}>
                Forgot password?
              </a>

              <button
                onClick={handleTeamLeadSignIn}
                style={{
                  width: "100%",
                  height: "42px",
                  background: "var(--accent-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginBottom: "12px",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              >
                Sign in
              </button>

              <div style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-secondary)", textAlign: "center", fontFamily: "var(--font-sans)" }}>
                Don't have access?{" "}
                <a href="mailto:admin@elliot-ai.cloud" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
                  Request access
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
