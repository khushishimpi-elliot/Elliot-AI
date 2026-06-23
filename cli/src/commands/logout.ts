import chalk from "chalk";

import { clearAuth, loadConfig } from "../config/store.js";

export async function logoutCommand(): Promise<number> {
  const cfg = loadConfig();
  if (!cfg.token) {
    console.log(chalk.gray("Already signed out."));
    return 0;
  }
  clearAuth();
  console.log(chalk.green("✓ Signed out."));
  return 0;
}
