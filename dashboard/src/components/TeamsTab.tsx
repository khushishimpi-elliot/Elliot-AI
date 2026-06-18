import { useTeams } from "../hooks/useTeams";

interface Props {
  tenantId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function short(uuid: string): string {
  return uuid.slice(0, 8);
}

export function TeamsTab({ tenantId }: Props) {
  const { members, loading, error } = useTeams(tenantId);

  if (loading) return <div className="placeholder">Loading...</div>;

  return (
    <div>
      {error && <div className="demo-banner">{error}</div>}
      {members.length === 0 ? (
        <div className="placeholder">No members found</div>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Role ID</th>
              <th>Joined</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td className="mono">{short(m.id)}</td>
                <td className="mono">{short(m.role_id)}</td>
                <td>{formatDate(m.joined_at)}</td>
                <td>
                  <span className={`badge ${m.is_active ? "badge-active" : "badge-inactive"}`}>
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
