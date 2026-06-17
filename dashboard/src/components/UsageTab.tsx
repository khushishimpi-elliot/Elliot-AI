import { useUsage } from "../hooks/useUsage";
import "./UsageTab.css";

interface UsageTabProps {
  tenantId: string;
}

export function UsageTab({ tenantId }: UsageTabProps) {
  const { data, loading, error } = useUsage(tenantId);

  if (loading) {
    return <div className="placeholder">Loading usage data...</div>;
  }

  if (!data) {
    return <div className="placeholder">Failed to load usage data</div>;
  }

  return (
    <div className="usage-tab">
      {/* Summary Cards */}
      <div className="summary-cards">
        <SummaryCard
          title="Total tokens this month"
          value={formatTokens(data.summary.total_tokens)}
          subtext="tokens used"
        />
        <SummaryCard
          title="Total cost this month"
          value={`$${data.summary.total_cost.toFixed(2)}`}
          subtext="this month"
        />
        <SummaryCard
          title="Active developers"
          value={data.summary.active_devs}
          subtext="active this month"
        />
        <SummaryCard
          title="Most used model"
          value={data.summary.top_model}
          subtext="primary model"
        />
      </div>

      {/* Team Usage */}
      <section className="section">
        <h2>Token usage by team</h2>
        <div className="team-bars">
          {data.teams.map((team: { name: string; cost: number; pct: number }) => (
            <div key={team.name} className="team-bar-row">
              <div className="team-name">{team.name}</div>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{ width: `${team.pct}%` }}
                ></div>
              </div>
              <div className="bar-percentage">{team.pct}%</div>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Cost Trend */}
      <section className="section">
        <h2>Daily cost — last 7 days</h2>
        <div className="chart-container">
          <div className="daily-chart">
            {data.daily.map((day: { date: string; cost: number }, idx: number) => {
              const maxCost = Math.max(...data.daily.map((d: { cost: number }) => d.cost));
              const height = (day.cost / maxCost) * 100;
              return (
                <div key={idx} className="chart-bar-wrapper">
                  <div className="chart-bar" style={{ height: `${height}%` }}>
                    <span className="bar-value">${day.cost.toFixed(2)}</span>
                  </div>
                  <div className="chart-label">{day.date}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Developer Breakdown */}
      <section className="section">
        <h2>Usage by developer</h2>
        <table className="developer-table">
          <thead>
            <tr>
              <th>Developer</th>
              <th>Queries</th>
              <th>Input tokens</th>
              <th>Output tokens</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.developers.map((dev: { email: string; queries: number; input_tokens: number; output_tokens: number; cost_usd: number }, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? "even" : "odd"}>
                <td className="dev-email">{dev.email}</td>
                <td>{dev.queries}</td>
                <td>{formatTokens(dev.input_tokens)}</td>
                <td>{formatTokens(dev.output_tokens)}</td>
                <td className="cost">${dev.cost_usd.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {error && <div className="demo-notice">📊 {error}</div>}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtext: string;
}

function SummaryCard({ title, value, subtext }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      <div className="card-subtext">{subtext}</div>
    </div>
  );
}

function formatTokens(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
