export function SettingsTab() {
  return (
    <div className="settings-tab">
      <div className="section">
        <h2>Organization settings</h2>

        {/* Organization Info */}
        <div className="settings-group">
          <h3>Organization info</h3>
          <div className="setting-item">
            <label>Organization name</label>
            <input
              type="text"
              value="Elliot Systems"
              readOnly
              className="setting-input"
            />
          </div>
          <div className="setting-item">
            <label>Email</label>
            <input
              type="email"
              value="admin@elliotsystems.com"
              readOnly
              className="setting-input"
            />
          </div>
          <div className="setting-item">
            <label>Plan</label>
            <input
              type="text"
              value="Professional"
              readOnly
              className="setting-input"
            />
          </div>
        </div>

        {/* Team Settings */}
        <div className="settings-group">
          <h3>Team management</h3>
          <div className="setting-item">
            <label>Team seats</label>
            <div className="setting-value">15 / 20 used</div>
          </div>
          <button className="setting-button">Add team members</button>
        </div>

        {/* API Keys */}
        <div className="settings-group">
          <h3>API Keys</h3>
          <div className="setting-item">
            <div className="api-key-row">
              <span className="api-key-label">Production API Key</span>
              <span className="api-key-value">sk-proj-••••••••••••</span>
              <button className="icon-button">↻</button>
            </div>
          </div>
          <button className="setting-button">Generate new key</button>
        </div>

        {/* Billing */}
        <div className="settings-group">
          <h3>Billing</h3>
          <div className="setting-item">
            <label>Billing period</label>
            <div className="setting-value">Monthly (Jun 1 - Jun 30)</div>
          </div>
          <button className="setting-button">Manage billing</button>
        </div>

        {/* Notifications */}
        <div className="settings-group">
          <h3>Notifications</h3>
          <div className="setting-item checkbox">
            <input type="checkbox" id="email-usage" defaultChecked />
            <label htmlFor="email-usage">Email me about usage alerts</label>
          </div>
          <div className="setting-item checkbox">
            <input type="checkbox" id="email-reports" defaultChecked />
            <label htmlFor="email-reports">Weekly usage reports</label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-group danger-zone">
          <h3>Danger zone</h3>
          <button className="danger-button">Delete organization</button>
        </div>
      </div>
    </div>
  );
}
