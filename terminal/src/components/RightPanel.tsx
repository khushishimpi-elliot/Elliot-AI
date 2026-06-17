interface RightPanelProps {
  files: string[];
  context?: {
    jira?: string;
    pr?: string;
    adr?: string;
    chunks?: number;
  };
}

export default function RightPanel({ files, context }: RightPanelProps) {
  return (
    <div className="right-panel">
      <div className="right-panel-section">
        <div className="right-panel-label">Files</div>
        <div className="right-panel-content">
          {files && files.length > 0 ? (
            files.map((file, i) => (
              <div key={i} className="right-panel-item">
                {file}
              </div>
            ))
          ) : (
            <div className="right-panel-content-empty">no files yet</div>
          )}
        </div>
      </div>

      <div className="right-panel-section">
        <div className="right-panel-label">Context</div>
        <div className="right-panel-content">
          {context?.jira && (
            <div className="right-panel-item">
              Jira: {context.jira}
            </div>
          )}
          {context?.pr && (
            <div className="right-panel-item">
              PR {context.pr}
            </div>
          )}
          {context?.adr && (
            <div className="right-panel-item">
              {context.adr}
            </div>
          )}
          {context?.chunks !== undefined && (
            <div className="right-panel-item">
              {(context.chunks / 1024).toFixed(0)}k chunks
            </div>
          )}
          {!context?.jira && !context?.pr && !context?.adr && (
            <div className="right-panel-item">
              {(context?.chunks ?? 542000) / 1024}k chunks
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
