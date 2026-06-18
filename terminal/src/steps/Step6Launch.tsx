interface Step6Props {
  onComplete?: () => void;
}

export default function Step6Launch({ onComplete = () => {} }: Step6Props) {
  const handleLaunch = () => {
    setTimeout(() => onComplete(), 300);
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          SETUP COMPLETE · STEP 6 OF 6
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
          Elliot-AI is ready
        </h1>
        <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
          Your organization's knowledge, repositories and engineering standards are live. Elliot now operates with full context.
        </p>
      </div>

      {/* Green Checkmark */}
      <div style={{ width: "52px", height: "52px", background: "rgba(79,255,176,0.08)", border: "1px solid rgba(79,255,176,0.3)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "var(--accent-green)", fontWeight: "700", marginBottom: "24px" }}>
        ✓
      </div>

      {/* Summary Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", overflow: "hidden", maxWidth: "540px", marginBottom: "28px" }}>
        {[
          { label: "Organization", value: "ELLIOT SYSTEMS" },
          { label: "Stack", value: "TypeScript / Node" },
          { label: "Standards", value: "Vitest · 90% gate · 2 approvals" },
          { label: "Architecture", value: "Hexagonal / ports & adapters" },
          { label: "Compliance", value: "SOC 2, PCI-DSS" },
          { label: "Connected", value: "7 sources · 542.0k chunks indexed" },
        ].map((row, i) => (
          <div key={row.label} style={{ display: "flex", padding: "11px 18px", borderBottom: i < 5 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)" }}>
            <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-muted)", width: "130px", fontFamily: "var(--font-sans)" }}>{row.label}</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Launch Button */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={handleLaunch}
          style={{
            background: "var(--accent-green)",
            color: "black",
            border: "none",
            borderRadius: "5px",
            fontSize: "15px",
            fontWeight: "700",
            padding: "11px 24px",
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          $ Launch Elliot terminal →
        </button>
        <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>Opens your workspace</span>
      </div>
    </div>
  );
}
