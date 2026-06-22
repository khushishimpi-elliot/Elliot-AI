import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface ElliotConfig {
  jwt_token: string;
  tenant_id: string;
  user_id: string;
  team_id: string;
  org_name: string;
  stack: string;
  backend_url: string;
  onboarding_url: string;
  configured_at: string;
}

function getConfigPath(): string {
  return path.join(os.homedir(), ".elliot", "config.json");
}

export function readConfig(): ElliotConfig | null {
  try {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data) as ElliotConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: ElliotConfig): void {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function isConfigured(): boolean {
  const config = readConfig();
  return config !== null && !!config.jwt_token;
}

export function clearConfig(): void {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
