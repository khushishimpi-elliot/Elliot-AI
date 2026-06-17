import { useState } from "react";

interface Step1Props {
  onContinue: () => void;
}

interface OAuthModal {
  provider: "okta" | "entra" | "google" | null;
  authorized: boolean;
}

export default function Step1SignIn({ onContinue }: Step1Props) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [authMethod, setAuthMethod] = useState<"oauth" | "email" | null>(null);
  const [oauthModal, setOAuthModal] = useState<OAuthModal>({ provider: null, authorized: false });

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      return "Email is required";
    }
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleOAuthClick = (provider: "okta" | "entra" | "google") => {
    setAuthMethod("oauth");
    setOAuthModal({ provider, authorized: false });
  };

  const handleAuthorizeOAuth = () => {
    setOAuthModal((prev) => ({ ...prev, authorized: true }));
    setTimeout(() => {
      onContinue();
    }, 500);
  };

  const handleMagicLinkClick = () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setAuthMethod("email");
    setTimeout(() => {
      onContinue();
    }, 500);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError("");
    }
  };

  const getProviderInfo = (provider: "okta" | "entra" | "google") => {
    const info = {
      okta: {
        name: "Okta",
        scopes: ["read:user_profile", "read:groups", "read:org_config"],
      },
      entra: {
        name: "Microsoft Entra",
        scopes: ["User.Read", "Directory.Read.All", "GroupMember.Read.All"],
      },
      google: {
        name: "Google Workspace",
        scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/admin.directory.group.readonly"],
      },
    };
    return info[provider];
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-label">IDENTITY · STEP 1 OF 6</div>
        <h1>Sign in to Elliot-AI</h1>
        <p className="step-description">
          Authenticate with your organization's identity provider. Elliot inherits your SSO
          groups and least-privilege roles.
        </p>
      </div>

      <div className="step-body">
        <div className="auth-options">
          <button
            className="auth-card"
            onClick={() => handleOAuthClick("okta")}
            disabled={authMethod !== null && authMethod !== "oauth"}
          >
            <span className="auth-icon">O</span>
            <div className="auth-text">
              <div className="auth-name">Continue with Okta</div>
              <div className="auth-subtitle">SAML / SCIM</div>
            </div>
            <span className="auth-arrow">→</span>
          </button>

          <button
            className="auth-card"
            onClick={() => handleOAuthClick("entra")}
            disabled={authMethod !== null && authMethod !== "oauth"}
          >
            <span className="auth-icon">E</span>
            <div className="auth-text">
              <div className="auth-name">Continue with Microsoft Entra</div>
              <div className="auth-subtitle">Azure AD</div>
            </div>
            <span className="auth-arrow">→</span>
          </button>

          <button
            className="auth-card"
            onClick={() => handleOAuthClick("google")}
            disabled={authMethod !== null && authMethod !== "oauth"}
          >
            <span className="auth-icon">G</span>
            <div className="auth-text">
              <div className="auth-name">Continue with Google Workspace</div>
              <div className="auth-subtitle">OIDC</div>
            </div>
            <span className="auth-arrow">→</span>
          </button>
        </div>

        <div className="auth-divider">or with email</div>

        <div className="email-input-group">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="you@core-payments.com"
            className={`email-input ${emailError ? "error" : ""}`}
            disabled={authMethod !== null && authMethod !== "email"}
          />
          {emailError && <div className="input-error">{emailError}</div>}
        </div>

        <button
          onClick={handleMagicLinkClick}
          className="btn btn-outline btn-full"
          disabled={authMethod === "oauth"}
        >
          Send magic link
        </button>
      </div>

      {oauthModal.provider && (
        <div className="oauth-modal-overlay" onClick={() => setOAuthModal({ provider: null, authorized: false })}>
          <div className="oauth-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setOAuthModal({ provider: null, authorized: false })}
            >
              ×
            </button>

            {!oauthModal.authorized ? (
              <>
                <div className="oauth-header">
                  <span className="oauth-icon">E</span>
                  <span className="oauth-divider">↔</span>
                  <span className="oauth-icon">⚙</span>
                  <div className="oauth-label">OAUTH 2.0 · secure handshake</div>
                </div>

                <h2>Authorize Elliot-AI for {getProviderInfo(oauthModal.provider).name}</h2>
                <p>Elliot-AI is requesting the following scopes:</p>

                <div className="oauth-scopes">
                  {getProviderInfo(oauthModal.provider).scopes.map((scope) => (
                    <div key={scope} className="oauth-scope">
                      › {scope}
                    </div>
                  ))}
                </div>

                <div className="oauth-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleAuthorizeOAuth}
                  >
                    Authorize
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setOAuthModal({ provider: null, authorized: false })}
                  >
                    Cancel
                  </button>
                </div>

                <p className="oauth-footer">
                  Read-only by default · revocable anytime · no source code leaves your tenancy
                </p>
              </>
            ) : (
              <div className="oauth-success">
                <div className="oauth-checkmark">✓</div>
                <h2>{getProviderInfo(oauthModal.provider).name} Connected</h2>
                <p>Authorization successful. Proceeding to next step...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
