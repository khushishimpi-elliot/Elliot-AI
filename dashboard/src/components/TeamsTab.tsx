interface Team {
  name: string;
  members: number;
  tokens: number;
  cost: number;
  model: string;
}

export function TeamsTab() {
  const teams: Team[] = [
    {
      name: "Backend",
      members: 4,
      tokens: 850000,
      cost: 18.5,
      model: "claude-sonnet-4-6",
    },
    {
      name: "Frontend",
      members: 3,
      tokens: 600000,
      cost: 13.2,
      model: "claude-sonnet-4-6",
    },
    {
      name: "Data",
      members: 2,
      tokens: 400000,
      cost: 8.8,
      model: "claude-opus-4-8",
    },
    {
      name: "DevOps",
      members: 2,
      tokens: 250000,
      cost: 5.5,
      model: "claude-sonnet-4-6",
    },
  ];

  const formatTokens = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="teams-tab">
      <div className="section">
        <h2>Teams overview</h2>
        <table className="teams-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>Members</th>
              <th>Tokens used</th>
              <th>Cost</th>
              <th>Primary model</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "even" : "odd"}>
                <td className="team-name">{team.name}</td>
                <td>{team.members}</td>
                <td>{formatTokens(team.tokens)}</td>
                <td className="cost">${team.cost.toFixed(2)}</td>
                <td>{team.model}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
