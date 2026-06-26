export type SettingsData = {
  organization: {
    name: string;
    email: string;
    plan: string;
  };

  apiKeys: {
    production: string;
    development: string;
  };

  repository: {
    defaultBranch: string;
    analysisDepth: string;
    autoSync: boolean;
  };

  model: {
    defaultModel: string;
    temperature: number;
  };

  notifications: {
    dailySummary: boolean;
    integrationErrors: boolean;
    usageAlerts: boolean;
  };

  team: {
    usedSeats: number;
    totalSeats: number;
  };
};

type SettingsProps = {
  settings: SettingsData;
};

export default function Settings({
  settings,
}: SettingsProps) {
  return (
    <div className="section">

      <h2>Settings</h2>

      <div className="settings-group">
        <h3>Organization Information</h3>

        <div className="setting-item">
          <label>Organization Name</label>
          <input
            className="setting-input"
            value={settings.organization.name}
            readOnly
          />
        </div>

        <div className="setting-item">
          <label>Admin Email</label>
          <input
            className="setting-input"
            value={settings.organization.email}
            readOnly
          />
        </div>

        <div className="setting-item">
          <label>Plan</label>
          <input
            className="setting-input"
            value={settings.organization.plan}
            readOnly
          />
        </div>
      </div>

      <div className="settings-group">
        <h3>API Keys</h3>

        <div className="api-key-row">
          <div>
            <div className="api-key-label">
              Production API Key
            </div>
            <div className="api-key-value">
              {settings.apiKeys.production}
            </div>
          </div>

          <button className="setting-button">
            Regenerate
          </button>
        </div>

        <div className="api-key-row">
          <div>
            <div className="api-key-label">
              Development API Key
            </div>
            <div className="api-key-value">
              {settings.apiKeys.development}
            </div>
          </div>

          <button className="setting-button">
            Regenerate
          </button>
        </div>
      </div>

      <div className="settings-group">
        <h3>Repository Settings</h3>

        <div className="setting-item">
          <label>Default Branch</label>
          <input
            className="setting-input"
            value={settings.repository.defaultBranch}
            readOnly
          />
        </div>

        <div className="setting-item">
          <label>Analysis Depth</label>
          <input
            className="setting-input"
            value={settings.repository.analysisDepth}
            readOnly
          />
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.repository.autoSync}
            readOnly
          />
          <span>Enable Auto Sync</span>
        </div>
      </div>

      <div className="settings-group">
        <h3>Model Preferences</h3>

        <div className="setting-item">
          <label>Default Model</label>
          <input
            className="setting-input"
            value={settings.model.defaultModel}
            readOnly
          />
        </div>

        <div className="setting-item">
          <label>Temperature</label>
          <input
            className="setting-input"
            value={settings.model.temperature}
            readOnly
          />
        </div>
      </div>

      <div className="settings-group">
        <h3>Notifications</h3>

        <div className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.notifications.dailySummary}
            readOnly
          />
          <span>Daily Summary</span>
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.notifications.integrationErrors}
            readOnly
          />
          <span>Integration Error Alerts</span>
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.notifications.usageAlerts}
            readOnly
          />
          <span>Usage Alerts</span>
        </div>
      </div>

      <div className="settings-group">
        <h3>Team Management</h3>

        <div className="setting-item">
          <label>Used Seats</label>
          <input
            className="setting-input"
            value={settings.team.usedSeats}
            readOnly
          />
        </div>

        <div className="setting-item">
          <label>Total Seats</label>
          <input
            className="setting-input"
            value={settings.team.totalSeats}
            readOnly
          />
        </div>
      </div>

      <div className="settings-group danger-zone">
        <h3>Danger Zone</h3>

        <p>
          Delete the workspace and remove all indexed
          repositories, connectors and embeddings.
        </p>

        <button className="danger-button">
          Delete Workspace
        </button>
      </div>

    </div>
  );
}