interface Step6Props {
  onComplete?: () => void;
}

export default function Step6Launch({ onComplete = () => {} }: Step6Props) {
  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-label">SETUP COMPLETE · STEP 6 OF 6</div>
      </div>

      <div className="step-body launch-content">
        <div className="launch-icon">✓</div>
        <h1>Elliot-AI is ready</h1>
        <p className="step-description">
          Your organization's knowledge, repositories and engineering standards are live. Elliot
          now operates with full context.
        </p>

        <div className="launch-summary">
          <div className="summary-item">
            <span className="summary-key">Organization</span>
            <span className="summary-val">Elliot Systems</span>
          </div>
          <div className="summary-item">
            <span className="summary-key">Stack</span>
            <span className="summary-val">TypeScript / Node</span>
          </div>
          <div className="summary-item">
            <span className="summary-key">Standards</span>
            <span className="summary-val">Vitest · 90% gate · 2 approvals</span>
          </div>
          <div className="summary-item">
            <span className="summary-key">Architecture</span>
            <span className="summary-val">Hexagonal / ports & adapters</span>
          </div>
          <div className="summary-item">
            <span className="summary-key">Compliance</span>
            <span className="summary-val">SOC 2, PCI-DSS</span>
          </div>
          <div className="summary-item">
            <span className="summary-key">Connected</span>
            <span className="summary-val">7 sources · 542.0k chunks indexed</span>
          </div>
        </div>

        <button onClick={onComplete} className="btn btn-launch">
          $ Launch Elliot terminal →
        </button>
        <p className="launch-helper">Opens your workspace</p>
      </div>
    </div>
  );
}
