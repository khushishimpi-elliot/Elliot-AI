import { useState } from "react";

interface Step1Props {
  onContinue: () => void;
}

export default function Step1SignIn({ onContinue }: Step1Props) {
  const [email, setEmail] = useState("");

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
          <button className="auth-card">
            <span className="auth-icon">O</span>
            <div className="auth-text">
              <div className="auth-name">Continue with Okta</div>
              <div className="auth-subtitle">SAML / SCIM</div>
            </div>
            <span className="auth-arrow">→</span>
          </button>

          <button className="auth-card">
            <span className="auth-icon">E</span>
            <div className="auth-text">
              <div className="auth-name">Continue with Microsoft Entra</div>
              <div className="auth-subtitle">Azure AD</div>
            </div>
            <span className="auth-arrow">→</span>
          </button>

          <button className="auth-card">
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
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@core-payments.com"
            className="email-input"
          />
        </div>

        <button onClick={onContinue} className="btn btn-outline btn-full">
          Send magic link
        </button>
      </div>
    </div>
  );
}
