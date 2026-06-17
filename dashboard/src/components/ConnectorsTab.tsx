interface Connector {
  name: string;
  status: "connected" | "not connected" | "error";
  lastSync?: string;
  accountInfo?: string;
}

export function ConnectorsTab() {
  const connectors: Connector[] = [
    {
      name: "GitHub",
      status: "connected",
      lastSync: "2 hours ago",
      accountInfo: "khushishimpi-elliot",
    },
    {
      name: "GitLab",
      status: "connected",
      lastSync: "1 hour ago",
      accountInfo: "elliot-ai-org",
    },
    {
      name: "Jira",
      status: "connected",
      lastSync: "30 minutes ago",
      accountInfo: "elliot.atlassian.net",
    },
    {
      name: "Slack",
      status: "connected",
      lastSync: "5 minutes ago",
      accountInfo: "elliot-systems",
    },
    {
      name: "Linear",
      status: "not connected",
      accountInfo: "Not configured",
    },
    {
      name: "ClickUp",
      status: "error",
      lastSync: "Failed",
      accountInfo: "Connection expired",
    },
  ];

  return (
    <div className="connectors-tab">
      <div className="section">
        <h2>Connected integrations</h2>
        <div className="connectors-grid">
          {connectors.map((connector) => (
            <div
              key={connector.name}
              className={`connector-card status-${connector.status}`}
            >
              <div className="connector-header">
                <h3>{connector.name}</h3>
                <span className={`status-badge status-${connector.status}`}>
                  <span className="status-dot"></span>
                  {connector.status}
                </span>
              </div>
              <div className="connector-info">
                <div className="info-row">
                  <span className="label">Account:</span>
                  <span className="value">{connector.accountInfo}</span>
                </div>
                {connector.lastSync && (
                  <div className="info-row">
                    <span className="label">Last sync:</span>
                    <span className="value">{connector.lastSync}</span>
                  </div>
                )}
              </div>
              <button className="connector-action">
                {connector.status === "connected" ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
