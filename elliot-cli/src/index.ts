#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { askCommand } from "./commands/ask.js";
import { statusCommand } from "./commands/status.js";
import { logoutCommand } from "./commands/logout.js";

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

program.parse(process.argv);
