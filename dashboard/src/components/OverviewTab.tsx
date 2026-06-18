import { useOverview } from "../hooks/useOverview";

interface Props {
  tenantId: string;
}

export function OverviewTab({ tenantId }: Props) {
  const { data, loading, error } = useOverview(tenantId);

  if (loading) return <div className="placeholder">Loading...</div>;
  if (!data) return <div className="placeholder">No data available</div>;

  return (
    <div>
      {error && <div className="demo-banner">{error}</div>}
      <div className="cards">
        <Card label="Organisation" value={data.org.name} />
        <Card label="Team Size" value={data.org.team_size ?? "—"} />
        <Card
          label="Connected"
          value={`${data.connectors.length} connector${data.connectors.length !== 1 ? "s" : ""}`}
        />
        <Card
          label="Knowledge Base"
          value={`${data.chunk_count.toLocaleString()} chunks`}
        />
      </div>
      {data.sdlc && (
        <div className="sdlc-section">
          <h2 className="section-title">SDLC Standards</h2>
          <dl className="sdlc-grid">
            {data.sdlc.stack && (
              <SdlcRow label="Stack" value={data.sdlc.stack} />
            )}
            {data.sdlc.branching_model && (
              <SdlcRow label="Branching" value={data.sdlc.branching_model} />
            )}
            {data.sdlc.test_framework && (
              <SdlcRow label="Testing" value={data.sdlc.test_framework} />
            )}
            {data.sdlc.ci_cd_platform && (
              <SdlcRow label="CI/CD" value={data.sdlc.ci_cd_platform} />
            )}
            {data.sdlc.review_policy && (
              <SdlcRow label="Reviews" value={data.sdlc.review_policy} />
            )}
            {data.sdlc.arch_style && (
              <SdlcRow label="Architecture" value={data.sdlc.arch_style} />
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}

function SdlcRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="sdlc-label">{label}</dt>
      <dd className="sdlc-value">{value}</dd>
    </>
  );
}
