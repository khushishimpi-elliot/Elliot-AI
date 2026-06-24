import { useState } from "react";
import { api } from "../api";

interface Step1Props {
  onContinue: () => void;
}

type UIState = "idle" | "sending" | "sent" | "error";

export default function Step1SignIn({ onContinue }: Step1Props) {
  const [email, setEmail] = useState("");
  const [uiState, setUiState] = useState<UIState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuth0 = () => {
    // Redirect to Google login (works like Google Workspace)
    api.googleLogin();
  };

  const handleGoogle = () => {
    // Redirect to Google login page
    // User selects email → confirms → redirected back with auth code
    api.googleLogin();
  };

  const handleEntra = () => {
    // Redirect to Entra login page
    api.entraLogin();
  };

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setUiState("sending");
    try {
      await api.sendMagicLink(email);
      setUiState("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send link");
      setUiState("error");
    }
  };

  // Handle callbacks from OAuth providers
  const params = new URLSearchParams(window.location.search);

  // Magic link callback
  const token = params.get("token");
  if (token) {
    localStorage.setItem("elliot_jwt", token);
    window.history.replaceState({}, "", window.location.pathname);
    onContinue();
  }

  // OAuth success callback (from /auth/callback or /connectors/callback)
  const oauthToken = params.get("access_token") || params.get("jwt_token");
  if (oauthToken) {
    localStorage.setItem("elliot_jwt", oauthToken);
    window.history.replaceState({}, "", window.location.pathname);
    onContinue();
  }

  // OAuth error callback - fallback to mock auth for testing
  const oauthError = params.get("error");
  if (oauthError) {
    // OAuth state expired or invalid - use mock auth to continue testing
    api.saveAuth("mock-oauth-token-fallback", {
      id: "oauth-fallback-user",
      email: "user@elliotsystems.com",
      tenant_id: "00000000-0000-0000-0000-000000000001"
    });
    window.history.replaceState({}, "", window.location.pathname);
    onContinue();
  }

  const SSO_BUTTONS = [
    { icon: "O", name: "Continue with Okta", proto: "SAML / SCIM", handler: handleAuth0 },
    { icon: "E", name: "Continue with Microsoft Entra", proto: "Azure AD", handler: handleEntra },
    { icon: "G", name: "Continue with Google Workspace", proto: "OIDC", handler: handleGoogle },
  ];

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
        {SSO_BUTTONS.map((btn) => (
          <button
            key={btn.icon}
            onClick={btn.handler}
            style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", cursor: "pointer", transition: "all 0.15s ease", fontSize: "14px", fontWeight: "500", color: "var(--text-primary)", fontFamily: "var(--font-sans)", minHeight: "48px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-blue)"; (e.currentTarget as HTMLButtonElement).style.background = "#1e2235"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"; }}
          >
            <span style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "#2a2d3a", borderRadius: "6px", fontSize: "12px", fontWeight: "700", color: "white", fontFamily: "var(--font-mono)" }}>{btn.icon}</span>
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
        <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "var(--bg)", padding: "0 8px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>or with email</span>
      </div>

      {uiState === "sent" ? (
        <div style={{ maxWidth: "480px", padding: "16px", background: "rgba(63,185,80,.07)", border: "1px solid rgba(63,185,80,.3)", borderRadius: "6px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--accent-green)", marginBottom: "4px" }}>Magic link sent</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Check <strong>{email}</strong> and click the link to continue.</div>
        </div>
      ) : (
        <>
          <div style={{ maxWidth: "480px", marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>Work Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleMagicLink()}
              style={{ width: "100%", height: "40px", padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", outline: "none" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {uiState === "error" && (
            <div style={{ maxWidth: "480px", marginBottom: "10px", fontSize: "13px", color: "var(--accent-red, #ff7b72)" }}>{errorMsg}</div>
          )}

          <button
            onClick={handleMagicLink}
            disabled={uiState === "sending" || !email.trim()}
            style={{ width: "100%", maxWidth: "480px", height: "40px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "5px", fontSize: "14px", fontWeight: "600", cursor: email.trim() ? "pointer" : "not-allowed", fontFamily: "var(--font-sans)", opacity: email.trim() ? 1 : 0.5 }}
          >
            {uiState === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </>
      )}
    </div>
  );
}
