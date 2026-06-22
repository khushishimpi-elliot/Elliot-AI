import { ElliotConfig, readConfig, writeConfig } from "./config";

export function getToken(): string | null {
  const config = readConfig();
  return config?.jwt_token || null;
}

export function saveToken(config: ElliotConfig): void {
  writeConfig(config);
}

export function isTokenValid(config: ElliotConfig): boolean {
  return !!config.jwt_token && config.jwt_token.length > 0;
}
