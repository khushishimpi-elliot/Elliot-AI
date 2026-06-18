import { useConnectors } from "../hooks/useConnectors";

interface Props { tenantId: string; }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ConnectorsTab({ tenantId }: Props) {
  const { connectors, loading, error } = useConnectors(tenantId);
  if (loading) return <div className="placeholder">Loading...</div>;
  return (
    <div>
      {error && <div className="demo-banner">{error}</div>}
      <div className="connector-grid">
        {connectors.map((c) => (
          <div key={c.id} className={`connector-card ${c.status === "connected" ? "connector-card--connected" : ""}`}>
            <div className="connector-header">
              <div className="connector-icon">{c.provider.charAt(0).toUpperCase()}</div>
              <div>
                <div className="connector-name">{c.provider.charAt(0).toUpperCase() + c.provider.slice(1)}</div>
                <span className={`badge ${c.status === "connected" ? "badge-active" : "badge-inactive"}`}>
                  {c.status === "connected" ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>
            <div className="connector-meta">
              <div className="connector-row">
                <span className="connector-label">Last synced</span>
                <span className="connector-value">{c.last_synced ? formatDate(c.last_synced) : "Never"}</span>
              </div>
              <div className="connector-row">
                <span className="connector-label">Scopes</span>
                <span className="connector-value">{c.scopes.length > 0 ? c.scopes.join(", ") : "—"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
