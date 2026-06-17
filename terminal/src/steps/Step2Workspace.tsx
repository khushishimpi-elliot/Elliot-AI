import { useState } from "react";

interface Step2Props {
  onContinue: () => void;
  onBack: () => void;
}

export default function Step2Workspace({ onContinue, onBack }: Step2Props) {
  const [orgName, setOrgName] = useState("Core Payments, Inc.");
  const [domain, setDomain] = useState("https://core-payments.com");
  const [teamSize, setTeamSize] = useState("21-100");
  const [residency, setResidency] = useState("us");

  return (
    <div className="step-content">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>←</button>
        <div className="step-label">WORKSPACE · STEP 2 OF 6</div>
        <h1>Set up your organization</h1>
        <p className="step-description">
          This becomes the tenancy Elliot operates in. Everything stays isolated to your org.
        </p>
      </div>

      <div className="step-body">
        <div className="form-group">
          <label className="form-label">ORGANIZATION NAME</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">PRIMARY DOMAIN</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">ENGINEERING TEAM SIZE</label>
          <div className="toggle-group">
            {["1-20", "21-100", "100-500", "500+"].map((size) => (
              <button
                key={size}
                className={`toggle-btn ${teamSize === size ? "active" : ""}`}
                onClick={() => setTeamSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">DATA RESIDENCY</label>
          <div className="toggle-group">
            {[
              { value: "us", label: "US" },
              { value: "eu", label: "EU" },
              { value: "uk", label: "UK" },
              { value: "apac", label: "APAC" },
            ].map((region) => (
              <button
                key={region.value}
                className={`toggle-btn ${residency === region.value ? "active" : ""}`}
                onClick={() => setResidency(region.value)}
              >
                {region.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onContinue} className="btn btn-primary">
          Continue →
        </button>
      </div>
    </div>
  );
}
