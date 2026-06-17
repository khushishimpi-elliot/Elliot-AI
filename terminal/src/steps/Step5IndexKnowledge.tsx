import { useState, useEffect } from "react";

interface Step5Props {
  onContinue: () => void;
  onBack: () => void;
}

interface IndexSource {
  name: string;
  progress: number;
  status: "indexing" | "indexed";
}

export default function Step5IndexKnowledge({ onContinue, onBack }: Step5Props) {
  const [sources, setSources] = useState<IndexSource[]>([
    { name: "GitHub", progress: 100, status: "indexed" },
    { name: "GitLab", progress: 100, status: "indexed" },
    { name: "Bitbucket", progress: 100, status: "indexed" },
    { name: "Jira", progress: 100, status: "indexed" },
    { name: "Google Drive", progress: 100, status: "indexed" },
    { name: "PostgreSQL", progress: 100, status: "indexed" },
    { name: "Slack", progress: 100, status: "indexed" },
  ]);

  useEffect(() => {
    // Simulate indexing process
    const interval = setInterval(() => {
      setSources((prev) =>
        prev.map((src) =>
          src.progress < 100
            ? { ...src, progress: Math.min(src.progress + 10, 100) }
            : { ...src, status: "indexed" }
        )
      );
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const allIndexed = sources.every((src) => src.status === "indexed");

  return (
    <div className="step-content">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>←</button>
        <div className="step-label">INDEX KNOWLEDGE · STEP 5 OF 6</div>
        <h1>Building organizational intelligence</h1>
        <p className="step-description">
          Elliot ingests, chunks and embeds your connected sources into a private vector index.
          Code symbols, docs and tickets become retrievable context.
        </p>
      </div>

      <div className="step-body">
        <div className="index-sources">
          {sources.map((source) => (
            <div key={source.name} className="index-source">
              <div className="source-icon">{source.name.charAt(0)}</div>
              <div className="source-info">
                <div className="source-name">{source.name}</div>
                <div className="source-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${source.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="source-status">
                {source.status === "indexed" ? "✓ indexed" : `${source.progress}%`}
              </div>
            </div>
          ))}
        </div>

        {allIndexed && (
          <div className="index-summary">
            <div className="summary-row">
              <div className="summary-label">EMBEDDED CHUNKS</div>
              <div className="summary-value">542.0k</div>
            </div>
            <div className="summary-row">
              <div className="summary-label">VECTOR INDEX</div>
              <div className="summary-value">pgvector · elliot-index</div>
            </div>
            <div className="summary-badge">✓ Ready</div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="btn btn-primary"
          disabled={!allIndexed}
        >
          Finish setup →
        </button>
      </div>
    </div>
  );
}
