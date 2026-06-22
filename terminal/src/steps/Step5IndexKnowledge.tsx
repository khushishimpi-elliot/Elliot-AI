import { useEffect, useState } from "react";

interface Step5Props {
  onContinue: () => void;
  onConfigUpdate?: (config: any) => void;
  onBack?: () => void;
}

export default function Step5IndexKnowledge({ onContinue, onConfigUpdate }: Step5Props) {
  const [progress, setProgress] = useState([0, 0, 0, 0, 0]);

  useEffect(() => {
    const intervals = progress.map((p, i) =>
      p < 100 ? setInterval(() => setProgress((prev) => [...prev.slice(0, i), Math.min(100, prev[i] + Math.random() * 15), ...prev.slice(i + 1)]), 150) : null
    );
    return () => intervals.forEach((i) => i && clearInterval(i));
  }, [progress]);

  const sources = ["GitHub", "Jira", "Confluence", "Slack", "PostgreSQL"];

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          KNOWLEDGE BASE · STEP 5 OF 6
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
          Building organizational intelligence
        </h1>
        <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
          Elliot ingests, chunks and embeds your connected sources into a private vector index.
        </p>
      </div>

      {/* Sources with Progress */}
      <div style={{ maxWidth: "600px", marginBottom: "24px" }}>
        {sources.map((source, i) => (
          <div key={source} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>{source}</span>
              <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--accent-green)", fontFamily: "var(--font-sans)" }}>indexed</span>
            </div>
            <div style={{ height: "3px", background: "var(--surface-2)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--accent-green)", width: `${progress[i]}%`, transition: "width 0.3s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "16px 20px", maxWidth: "500px", marginBottom: "24px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Embedded Chunks</div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>542.0k</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Vector Index</div>
          <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>pgvector · elliot-index</div>
          <div style={{ fontSize: "12px", fontWeight: "500", color: "var(--accent-green)", marginTop: "4px", fontFamily: "var(--font-sans)" }}>✓ Ready</div>
        </div>
      </div>

      <button onClick={onContinue} style={{ background: "var(--accent-blue)", color: "white", border: "none", borderRadius: "5px", fontSize: "14px", fontWeight: "600", padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Finish setup →</button>
    </div>
  );
}
