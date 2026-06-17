type TeamUsage = {
  name: string;
  usage: string;
  width: string;
};

type SystemStatus = {
  name: string;
  status: string;
};

type Integration = {
  name: string;
  status: string;
};

type OverviewProps = {
  stats: {
    totalTokens: string;
    monthlyCost: string;
    activeDevelopers: number;
    mostUsedModel: string;
  };

  teamUsage: TeamUsage[];

  systemStatus: SystemStatus[];

  integrations: Integration[];

  plan: {
    planType: string;
    teamMembers: number;
    monthlyLimit: string;
  };
};

export default function Overview({
  stats,
  teamUsage,
  systemStatus,
  integrations,
  plan,
}: OverviewProps) {
  return (
    <div className="content">
      {/* Summary Cards */}

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-label">Total Tokens</div>
          <div className="card-value">{stats.totalTokens}</div>
        </div>

        <div className="summary-card">
          <div className="card-label">Monthly Cost</div>
          <div className="card-value">{stats.monthlyCost}</div>
        </div>

        <div className="summary-card">
          <div className="card-label">Active Developers</div>
          <div className="card-value">{stats.activeDevelopers}</div>
        </div>

        <div className="summary-card">
          <div className="card-label">Most Used Model</div>
          <div className="card-value">{stats.mostUsedModel}</div>
        </div>
      </div>

      {/* Usage + Status */}

      <div className="two-column-grid">
        <div className="section">
          <h2>Token Usage By Team</h2>

          <div className="team-bars">
            {teamUsage.map((team) => (
              <div key={team.name} className="team-bar-row">
                <div className="team-name">{team.name}</div>

                <div className="bar-container">
                  <div
                    className="bar"
                    style={{ width: team.width }}
                  />
                </div>

                <div className="bar-percentage">
                  {team.usage}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>System Status</h2>

          <div className="status-list">
            {systemStatus.map((item) => (
              <div key={item.name} className="status-item">
                <span className="status-name">
                  {item.name}
                </span>

                <span className="status-badge badge-connected">
                  <span className="status-dot"></span>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integrations + Plan */}

      <div className="two-column-grid">
        <div className="section">
          <h2>Repository Integrations</h2>

          <div className="status-list">
            {integrations.map((item) => (
              <div key={item.name} className="status-item">
                <span className="status-name">
                  {item.name}
                </span>

                <span
                  className={`status-badge ${
                    item.status === "connected"
                      ? "badge-connected"
                      : "badge-not-connected"
                  }`}
                >
                  <span className="status-dot"></span>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>Plan & Usage</h2>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Plan Type</div>
              <div className="stat-value">
                {plan.planType}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Team Members</div>
              <div className="stat-value">
                {plan.teamMembers}
              </div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Monthly Limit</div>
              <div className="stat-value">
                {plan.monthlyLimit}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}