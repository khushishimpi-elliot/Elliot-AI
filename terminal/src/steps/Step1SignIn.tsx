import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Step1Props {
  onContinue: () => void;
}

type UIState = "idle" | "sending" | "sent" | "error";

export default function Step1SignIn({ onContinue }: Step1Props) {
  const [email, setEmail] = useState("");
  const [uiState, setUiState] = useState<UIState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSSO = () => {
    onContinue();
  };

  const handleMagicLink = async () => {
    if (!email.trim()) return;
    setUiState("sending");
    try {
      const res = await fetch(`${API_URL}/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      setUiState("sent");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to send link");
      setUiState("error");
    }
  };

  // Called when user returns from magic link click in email
  // The /auth/callback page stores the token then redirects back here
  const token = new URLSearchParams(window.location.search).get("token");
  if (token) {
    localStorage.setItem("elliot_token", token);
    window.history.replaceState({}, "", window.location.pathname);
    onContinue();
  }

  const SSO_BUTTONS = [
    { icon: "O", name: "Continue with Okta",               proto: "SAML / SCIM",  provider: "auth0"   as const },
    { icon: "E", name: "Continue with Microsoft Entra",    proto: "Azure AD",      provider: "entra"   as const },
    { icon: "G", name: "Continue with Google Workspace",   proto: "OIDC",          provider: "google"  as const },
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
            onClick={handleSSO}
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
