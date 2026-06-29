#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { askCommand } from "./commands/ask.js";
import { statusCommand } from "./commands/status.js";
import { logoutCommand } from "./commands/logout.js";
import { localCommand } from "./commands/local.js";
import { usageCommand } from "./commands/usage.js";
import { setupCommand } from "./commands/setup.js";

const program = new Command();

program
  .name("elliot-ai")
  .description("AI coding assistant for engineering teams")
  .version("1.0.0");

program
  .command("init")
  .description("Set up Elliot-AI for your organisation")
  .action(initCommand);

program
  .command("setup")
  .description("Configure Elliot-AI with workspace settings (from onboarding)")
  .requiredOption("--token <token>", "Your Elliot-AI JWT token from Step 6")
  .option("--tenant-id <tenantId>", "Your workspace tenant ID (from Step 6 command)")
  .action((options) => setupCommand(options));

program
  .command("ask", { isDefault: true })
  .description("Start interactive Elliot-AI terminal")
  .action(askCommand);

program
  .command("status")
  .description("Check Elliot-AI connection and connectors")
  .action(statusCommand);

program
  .command("logout")
  .description("Disconnect from your organisation")
  .action(logoutCommand);

program
  .command("local")
  .description("Run Elliot as a local coding agent (no backend required; uses GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY)")
  .action(localCommand);

program
  .command("usage")
  .description("Show how much Elliot-AI was used today (tokens, queries, models)")
  .option("-d, --date <YYYY-MM-DD>", "Show usage for a specific date")
  .option("-w, --week", "Show usage for the last 7 days")
  .action((opts) => usageCommand(opts));

program.parse(process.argv);
