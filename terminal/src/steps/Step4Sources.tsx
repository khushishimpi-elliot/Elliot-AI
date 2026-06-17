import { useState } from "react";

interface Step4Props {
  onContinue: () => void;
  onBack: () => void;
}

interface Provider {
  name: string;
  description: string;
  status: "not-connected" | "connected";
  category: string;
}

const providers: Record<string, Provider[]> = {
  repositories: [
    {
      name: "GitHub",
      description: "Read repos, open pull requests",
      status: "not-connected",
      category: "repositories",
    },
    {
      name: "GitLab",
      description: "Read repos, open merge requests",
      status: "not-connected",
      category: "repositories",
    },
  ],
  ticketing: [
    {
      name: "Jira",
      description: "Read issues and sprints",
      status: "not-connected",
      category: "ticketing",
    },
    {
      name: "Linear",
      description: "Read issues and cycles",
      status: "not-connected",
      category: "ticketing",
    },
  ],
  docs: [
    {
      name: "Confluence",
      description: "Read pages and spaces",
      status: "not-connected",
      category: "docs",
    },
    {
      name: "Notion",
      description: "Read databases and pages",
      status: "not-connected",
      category: "docs",
    },
  ],
};

export default function Step4Sources({ onContinue, onBack }: Step4Props) {
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [authorizing, setAuthorizing] = useState<string | null>(null);

  const handleConnect = (providerName: string) => {
    setAuthorizing(providerName);
  };

  const handleAuthorize = (providerName: string) => {
    setConnectedSources([...connectedSources, providerName]);
    setAuthorizing(null);
  };

  const canContinue = connectedSources.length > 0;

  return (
    <div className="step-content">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>←</button>
        <div className="step-label">CONNECT SOURCES · STEP 4 OF 6</div>
        <h1>Connect & authorize your sources</h1>
        <p className="step-description">
          Link the systems Elliot draws context from. OAuth is read-only by default and scoped per
          provider — review each grant before approving.
        </p>
      </div>

      <div className="step-body">
        <div className="sources-section">
          <div className="section-header">
            <h3>Repositories</h3>
            <span className="badge badge-required">required</span>
          </div>
          <p className="section-description">Source code Elliot reads, reviews, and writes against.</p>
          <div className="providers-grid">
            {providers.repositories.map((provider) => (
              <div key={provider.name} className="provider-card">
                <div className="provider-icon">{provider.name.charAt(0)}</div>
                <div className="provider-info">
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-desc">{provider.description}</div>
                </div>
                {connectedSources.includes(provider.name) ? (
                  <div className="provider-status connected">✓ Linked</div>
                ) : (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleConnect(provider.name)}
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="sources-section">
          <div className="section-header">
            <h3>Issue & Ticket Tracking</h3>
            <span className="badge badge-required">required</span>
          </div>
          <p className="section-description">Sprints, tickets and acceptance criteria for context.</p>
          <div className="providers-grid">
            {providers.ticketing.map((provider) => (
              <div key={provider.name} className="provider-card">
                <div className="provider-icon">{provider.name.charAt(0)}</div>
                <div className="provider-info">
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-desc">{provider.description}</div>
                </div>
                {connectedSources.includes(provider.name) ? (
                  <div className="provider-status connected">✓ Linked</div>
                ) : (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleConnect(provider.name)}
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="sources-section">
          <div className="section-header">
            <h3>Documentation</h3>
            <span className="badge badge-optional">optional</span>
          </div>
          <p className="section-description">Wikis and specs ingested into the knowledge base.</p>
          <div className="providers-grid">
            {providers.docs.map((provider) => (
              <div key={provider.name} className="provider-card">
                <div className="provider-icon">{provider.name.charAt(0)}</div>
                <div className="provider-info">
                  <div className="provider-name">{provider.name}</div>
                  <div className="provider-desc">{provider.description}</div>
                </div>
                {connectedSources.includes(provider.name) ? (
                  <div className="provider-status connected">✓ Linked</div>
                ) : (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleConnect(provider.name)}
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="btn btn-primary"
          disabled={!canContinue}
        >
          Continue ({connectedSources.length} sources linked) →
        </button>
      </div>

      {authorizing && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-label">OAUTH 2.0 · secure handshake</span>
            </div>
            <h2>Authorize Elliot-AI for {authorizing}</h2>
            <p>Elliot-AI is requesting the following scopes on repositories:</p>
            <ul className="scopes-list">
              <li>› read_repository</li>
              <li>› write_repository</li>
              <li>› read_api</li>
            </ul>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => handleAuthorize(authorizing)}
              >
                Authorize
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setAuthorizing(null)}
              >
                Cancel
              </button>
            </div>
            <p className="modal-footer">
              Read-only by default · revocable anytime · no source code leaves your tenancy
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
