export type Connector = {
  name: string;
  status: "connected" | "error";
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string | number;
  tertiaryLabel: string;
  tertiaryValue: string;
};

type ConnectorsProps = {
  connectors: Connector[];
};

export default function Connectors({
  connectors,
}: ConnectorsProps) {
  return (
    <div className="section">
      <h2>Repository & Tool Integrations</h2>

      <div className="connectors-grid">
        {connectors.map((connector) => (
          <div
            key={connector.name}
            className={`connector-card ${
              connector.status === "connected"
                ? "connector-success"
                : "connector-error"
            }`}
          >
            <div className="connector-top">
              <h3>{connector.name}</h3>

              <span
                className={`status-badge ${
                  connector.status === "connected"
                    ? "badge-connected"
                    : "badge-error"
                }`}
              >
                ● {connector.status}
              </span>
            </div>

            <div className="connector-details">
              <div>
                <span>{connector.primaryLabel}:</span>
                <strong>{connector.primaryValue}</strong>
              </div>

              <div>
                <span>{connector.secondaryLabel}:</span>
                <strong>{connector.secondaryValue}</strong>
              </div>

              <div>
                <span>{connector.tertiaryLabel}:</span>
                <strong>{connector.tertiaryValue}</strong>
              </div>
            </div>

            <button className="connector-btn">
              {connector.status === "error"
                ? "Reconnect"
                : "Manage"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}