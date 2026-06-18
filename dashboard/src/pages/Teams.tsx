type Team = {
  name: string;
  members: number;
  tokenUsage: string;
  monthlyCost: string;
  primaryModel: string;
};

export default function Teams() {
  const teams: Team[] = [
    {
      name: "Backend",
      members: 5,
      tokenUsage: "850K",
      monthlyCost: "$18.50",
      primaryModel: "Claude Sonnet",
    },
    {
      name: "Frontend",
      members: 4,
      tokenUsage: "600K",
      monthlyCost: "$12.20",
      primaryModel: "GPT-4o",
    },
    {
      name: "DevOps",
      members: 2,
      tokenUsage: "400K",
      monthlyCost: "$8.40",
      primaryModel: "Claude Sonnet",
    },
    {
      name: "Data",
      members: 3,
      tokenUsage: "250K",
      monthlyCost: "$5.10",
      primaryModel: "Gemini Pro",
    },
  ];

  return (
    <div className="section">
      <h2>Teams</h2>

      <table className="teams-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Members</th>
            <th>Token Usage</th>
            <th>Monthly Cost</th>
            <th>Primary Model</th>
          </tr>
        </thead>

        <tbody>
          {teams.map((team) => (
            <tr key={team.name}>
              <td>{team.name}</td>
              <td>{team.members}</td>
              <td>{team.tokenUsage}</td>
              <td>{team.monthlyCost}</td>
              <td>{team.primaryModel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}