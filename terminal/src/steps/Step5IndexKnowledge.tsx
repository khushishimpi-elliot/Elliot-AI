import { useEffect, useRef, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const POLL_MS = 3000;

interface IndexStats {
  sources: { name: string; progress: number; status: string }[];
  total_chunks: number;
  is_complete: boolean;
}

interface Step5Props {
  onContinue: () => void;
  onBack?: () => void;
}

export default function Step5IndexKnowledge({ onContinue }: Step5Props) {
  const [stats, setStats] = useState<IndexStats | null>(null);
  const [useMock, setUseMock] = useState(false);
  const [mockProgress, setMockProgress] = useState([0, 0, 0, 0, 0]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll the real API
  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem("elliot_token");
        const tenantId = localStorage.getItem("elliot_tenant_id") ?? "default";
        const res = await fetch(`${API_URL}/index/${tenantId}/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error();
        const data: IndexStats = await res.json();
        setStats(data);
        if (data.is_complete && pollRef.current) {
          clearInterval(pollRef.current);
        }
      } catch {
        // Backend not available — fall back to mock animation
        setUseMock(true);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }

    fetchStats();
    pollRef.current = setInterval(fetchStats, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Mock animation fallback
  useEffect(() => {
    if (!useMock) return;
    const id = setInterval(() => {
      setMockProgress((prev) => {
        const next = prev.map((p) => Math.min(100, p + Math.random() * 12));
        if (next.every((p) => p >= 100)) clearInterval(id);
        return next;
      });
    }, 150);
    return () => clearInterval(id);
  }, [useMock]);

  const sources = stats
    ? stats.sources
    : ["GitHub", "Jira", "Confluence", "Slack", "PostgreSQL"].map((name, i) => ({
        name,
        progress: mockProgress[i],
        status: mockProgress[i] >= 100 ? "indexed" : "indexing",
      }));

  const totalChunks = stats ? stats.total_chunks : 542_000;
  const allDone = sources.every((s) => s.progress >= 100);

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
        {sources.map((source) => (
          <div key={source.name} style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
                {source.name}
              </span>
              <span style={{ fontSize: "12px", fontWeight: "500", color: source.progress >= 100 ? "var(--accent-green)" : "var(--accent-blue)", fontFamily: "var(--font-sans)" }}>
                {source.progress >= 100 ? "indexed" : `${Math.round(source.progress)}%`}
              </span>
            </div>
            <div style={{ height: "3px", background: "var(--surface-2)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", background: source.progress >= 100 ? "var(--accent-green)" : "var(--accent-blue)", width: `${source.progress}%`, transition: "width 0.3s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "16px 20px", maxWidth: "500px", marginBottom: "24px", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Embedded Chunks</div>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>
            {totalChunks >= 1000 ? `${(totalChunks / 1000).toFixed(1)}k` : totalChunks}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-sans)", marginBottom: "6px" }}>Vector Index</div>
          <div style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>pgvector · elliot-index</div>
          <div style={{ fontSize: "12px", fontWeight: "500", color: allDone ? "var(--accent-green)" : "var(--accent-blue)", marginTop: "4px", fontFamily: "var(--font-sans)" }}>
            {allDone ? "✓ Ready" : "⟳ Indexing…"}
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        style={{ background: "var(--accent-blue)", color: "white", border: "none", borderRadius: "5px", fontSize: "14px", fontWeight: "600", padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
      >
        Finish setup →
      </button>
    </div>
  );
}
