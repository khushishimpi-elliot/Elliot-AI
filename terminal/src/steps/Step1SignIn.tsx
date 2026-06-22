import { useState } from "react";

interface OnboardingConfig {
  jwtToken?: string;
  tenantId?: string;
  userId?: string;
  teamId?: string;
  orgName?: string;
  stack?: string;
}

interface Step1Props {
  onContinue: () => void;
  onConfigUpdate?: (config: Partial<OnboardingConfig>) => void;
}

export default function Step1SignIn({ onContinue }: Step1Props) {
  const [email, setEmail] = useState("");

  const handleContinue = () => {
    setTimeout(() => onContinue(), 300);
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          IDENTITY · STEP 1 OF 6
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
          Sign in to Elliot-AI
        </h1>
        <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
          Authenticate with your organization's identity provider. Elliot inherits your SSO groups and least-privilege roles.
        </p>
      </div>

      {/* SSO Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px", maxWidth: "480px" }}>
        {[
          { icon: "O", name: "Continue with Okta", proto: "SAML / SCIM" },
          { icon: "E", name: "Continue with Microsoft Entra", proto: "Azure AD" },
          { icon: "G", name: "Continue with Google Workspace", proto: "OIDC" },
        ].map((btn) => (
          <button
            key={btn.icon}
            onClick={handleContinue}
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
      <div style={{ position: "relative", margin: "20px 0", maxWidth: "480px" }}>
        <div style={{ height: "1px", background: "var(--border)" }} />
        <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "var(--bg)", padding: "0 8px", fontSize: "12px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
          or with email
        </span>
      </div>

      {/* Email Input */}
      <div style={{ maxWidth: "480px", marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
          Work Email
        </label>
        <input
          type="email"
          placeholder="you@core-payments.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

      {/* Send Magic Link Button */}
      <button
        onClick={handleContinue}
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "40px",
          background: "transparent",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "5px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          transition: "all 0.15s ease",
          marginBottom: "20px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-blue)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
        }}
      >
        Send magic link
      </button>
    </div>
  );
}
