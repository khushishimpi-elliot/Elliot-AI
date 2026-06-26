import { useEffect, useState } from "react";

import { fetchLaunchSummary, LaunchSummary } from "./api";

interface Props {
  onLaunch: () => void;
  token?: string;
  /** Bypass the real fetch — useful in dev before task #27 lands. */
  useMock?: boolean;
}

/**
 * Final onboarding step (PDF page 3 step 6). Pulls the launch summary from
 * the backend and presents it as a confirmation before the user enters the
 * main terminal.
 */
export default function LaunchScreen({ onLaunch, token, useMock = false }: Props) {
  const [summary, setSummary] = useState<LaunchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLaunchSummary({ token, mock: useMock })
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "could not load launch summary");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, useMock]);

  if (loading) {
    return (
      <div className="launch" role="status">
        <p>Loading launch summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="launch" role="alert">
        <h2>Could not load launch summary</h2>
        <p>{error}</p>
        <p className="hint">
          Make sure the backend is running and you are signed in.
        </p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="launch">
      <h1>Setup complete</h1>
      <p className="lead">{summary.org_name}</p>

      <dl className="summary-grid">
        <dt>Primary stack</dt>
        <dd>{summary.primary_stack}</dd>

        <dt>Architecture</dt>
        <dd>{summary.arch_style}</dd>

        <dt>Compliance</dt>
        <dd>{summary.compliance.join(" · ")}</dd>

        <dt>Indexed chunks</dt>
        <dd>{summary.indexed_chunks.toLocaleString()}</dd>
      </dl>

      <h3>Connected sources</h3>
      <ul className="connectors">
        {summary.connectors.map((c) => (
          <li key={c.name} className={c.status}>
            <span className="dot" aria-hidden /> {c.name}
            <span className="status">{c.status === "connected" ? "connected" : "not connected"}</span>
          </li>
        ))}
      </ul>

      <button className="launch-button" onClick={onLaunch} autoFocus>
        Launch Elliot terminal
      </button>
    </div>
  );
}
