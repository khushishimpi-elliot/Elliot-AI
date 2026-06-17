interface SummaryCard {
  label: string;
  value: string;
}

export function OverviewTab() {
  const summaryCards: SummaryCard[] = [
    { label: "Total tokens", value: "2.4M" },
    { label: "This month cost", value: "$48.20" },
    { label: "Active devs", value: "12" },
  ];

  const teamUsage = [
    { name: "Backend", pct: 85 },
    { name: "Frontend", pct: 60 },
    { name: "Data", pct: 40 },
    { name: "DevOps", pct: 25 },
  ];

  const connectorStatus = [
    { name: "GitHub", status: "connected" },
    { name: "Jira", status: "connected" },
    { name: "Slack", status: "connected" },
    { name: "GitLab", status: "not connected" },
  ];

  const dailyCosts = [
    { day: "Mon", value: 5.2 },
    { day: "Tue", value: 7.2 },
    { day: "Wed", value: 6.4 },
    { day: "Thu", value: 8.9 },
    { day: "Fri", value: 7.2 },
    { day: "Sat", value: 9.3 },
    { day: "Sun", value: 3.4 },
  ];

  return (
    <div className="overview-tab">
      {/* Summary Cards */}
      <div className="summary-cards">
        {summaryCards.map((card) => (
          <div key={card.label} className="summary-card">
            <div className="card-label">{card.label}</div>
            <div className="card-value">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Team Usage */}
      <div className="section">
        <h2>Token usage by team</h2>
        <div className="team-bars">
          {teamUsage.map((team) => (
            <div key={team.name} className="team-bar-row">
              <div className="team-name">{team.name}</div>
              <div className="bar-container">
                <div className="bar" style={{ width: `${team.pct}%` }}></div>
              </div>
              <div className="bar-percentage">{team.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Connector Status */}
      <div className="section">
        <h2>Connector status</h2>
        <div className="connector-list">
          {connectorStatus.map((connector) => (
            <div key={connector.name} className="connector-row">
              <div className="connector-name">{connector.name}</div>
              <div className={`connector-status status-${connector.status}`}>
                <span className="status-dot"></span>
                {connector.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Cost Chart */}
      <div className="section">
        <h2>Daily cost (last 7 days)</h2>
        <div className="chart-container">
          <div className="daily-chart">
            {dailyCosts.map((day, idx) => {
              const maxCost = Math.max(...dailyCosts.map((d) => d.value));
              const height = (day.value / maxCost) * 100;
              return (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: `${height}%` }}>
                    <span className="bar-value">${day.value.toFixed(1)}</span>
                  </div>
                  <div className="chart-label">{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
