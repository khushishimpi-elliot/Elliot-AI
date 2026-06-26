interface LandingPageProps {
  onSignUp: () => void;
}

export default function LandingPage({ onSignUp }: LandingPageProps) {
  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
          <span style={{ color: "var(--accent-blue)", fontWeight: "600", fontSize: "24px" }}>[·]</span>
          <span style={{ color: "var(--text-primary)", fontWeight: "600", fontSize: "24px" }}>ELLIOT-AI</span>
        </div>

        <h1 style={{ fontSize: "48px", fontWeight: "700", lineHeight: "1.2", marginBottom: "16px", color: "var(--text-primary)", fontFamily: "var(--font-sans)", maxWidth: "600px" }}>
          The organization's
          <br />
          <span style={{ color: "var(--accent-blue)" }}>AI engineer.</span>
        </h1>

        <p style={{ fontSize: "16px", fontWeight: "400", lineHeight: "1.6", color: "var(--text-secondary)", marginBottom: "48px", maxWidth: "500px", fontFamily: "var(--font-sans)" }}>
          One terminal for your repositories, standards, tickets and knowledge — operated by specialized agents that ship to your conventions.
        </p>

        <button
          onClick={onSignUp}
          style={{
            padding: "12px 48px",
            background: "var(--accent-blue)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontFamily: "var(--font-sans)",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.9")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
        >
          Get started
        </button>
      </div>
    </div>
  );
}
