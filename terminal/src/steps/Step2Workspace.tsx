import { useState } from "react";

interface Step2Props {
  onContinue: () => void;
  onBack?: () => void;
}

export default function Step2Workspace({ onContinue }: Step2Props) {
  const [orgName, setOrgName] = useState("Core Payments, Inc.");
  const [domain, setDomain] = useState("core-payments.com");
  const [teamSize, setTeamSize] = useState("21-100");
  const [residency, setResidency] = useState("us");

  const handleContinue = () => {
    setTimeout(() => onContinue(), 300);
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          WORKSPACE · STEP 2 OF 6
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
          Set up your organization
        </h1>
        <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
          This becomes the tenancy Elliot operates in. Everything stays isolated to your org.
        </p>
      </div>

      {/* Form Fields */}
      <div style={{ maxWidth: "480px", marginBottom: "32px" }}>
        {/* Organization Name */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
            Organization Name
          </label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
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
              outline: "none",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Domain */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "6px", fontFamily: "var(--font-sans)" }}>
            Primary Domain
          </label>
          <div style={{ display: "flex", alignItems: "center", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "5px", height: "40px", paddingLeft: "12px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "14px", marginRight: "4px", fontFamily: "var(--font-sans)" }}>https://</span>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                paddingRight: "12px",
              }}
            />
          </div>
        </div>

        {/* Team Size */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            Engineering Team Size
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["1-20", "21-100", "100-500", "500+"].map((size) => (
              <button
                key={size}
                onClick={() => setTeamSize(size)}
                style={{
                  padding: "6px 14px",
                  background: teamSize === size ? "var(--surface-2)" : "transparent",
                  border: `1px solid ${teamSize === size ? "var(--accent-blue)" : "var(--border)"}`,
                  borderRadius: "4px",
                  color: teamSize === size ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s ease",
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Data Residency */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "500", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            Data Residency
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["US", "EU", "UK", "APAC"].map((region) => (
              <button
                key={region}
                onClick={() => setResidency(region.toLowerCase())}
                style={{
                  padding: "6px 14px",
                  background: residency === region.toLowerCase() ? "var(--surface-2)" : "transparent",
                  border: `1px solid ${residency === region.toLowerCase() ? "var(--accent-blue)" : "var(--border)"}`,
                  borderRadius: "4px",
                  color: residency === region.toLowerCase() ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all 0.15s ease",
                }}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        style={{
          background: "var(--accent-blue)",
          color: "white",
          border: "none",
          borderRadius: "5px",
          fontSize: "14px",
          fontWeight: "600",
          padding: "10px 20px",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
      >
        Continue →
      </button>
    </div>
  );
}
