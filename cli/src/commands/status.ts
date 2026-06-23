import chalk from "chalk";

import { ping } from "../api/client.js";
import { getLaunchSummary } from "../api/launch.js";
import { CONFIG_PATH_FOR_DISPLAY, isAuthenticated, loadConfig } from "../config/store.js";

export async function statusCommand(): Promise<number> {
  const cfg = loadConfig();

  console.log(chalk.bold("Elliot-AI CLI · status\n"));
  console.log(`  Config:  ${chalk.gray(CONFIG_PATH_FOR_DISPLAY)}`);
  console.log(`  API:     ${chalk.gray(cfg.apiUrl)}`);

  const reachable = await ping();
  const dot = reachable ? chalk.green("●") : chalk.red("●");
  console.log(`  Backend: ${dot} ${reachable ? "reachable" : "unreachable"}`);

  if (!isAuthenticated(cfg)) {
    console.log(chalk.yellow("\nNot signed in. Run `elliot login`."));
    return 0;
  }

  console.log(`  Signed in as: ${chalk.cyan(cfg.email ?? "?")}`);
  if (cfg.orgName) console.log(`  Org:          ${chalk.cyan(cfg.orgName)}`);
  if (cfg.loggedInAt) {
    console.log(`  Since:        ${chalk.gray(cfg.loggedInAt)}`);
  }

  if (!reachable) return 0;

  try {
    const s = await getLaunchSummary();
    console.log(chalk.bold("\nWorkspace"));
    if (s.primary_stack) console.log(`  Stack:    ${s.primary_stack}`);
    if (s.arch_style) console.log(`  Arch:     ${s.arch_style}`);
    if (s.indexed_chunks != null) {
      console.log(`  Indexed:  ${chalk.green(s.indexed_chunks.toLocaleString())} chunks`);
    }
    if (s.connectors?.length) {
      console.log(chalk.bold("\nConnectors"));
      for (const c of s.connectors) {
        const cd = c.status === "connected" ? chalk.green("●") : chalk.gray("○");
        console.log(`  ${cd} ${c.name}`);
      }
    }
  } catch {
    console.log(chalk.yellow("\nCould not fetch /launch — token may be expired."));
  }
  return 0;
}
