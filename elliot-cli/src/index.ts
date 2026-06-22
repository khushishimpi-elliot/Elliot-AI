#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init";
import { askCommand } from "./commands/ask";
import { statusCommand } from "./commands/status";
import { logoutCommand } from "./commands/logout";

const program = new Command();

program
  .name("elliot")
  .description("AI coding assistant for engineering teams")
  .version("1.0.0");

program
  .command("init")
  .description("Set up Elliot-AI for your organisation")
  .action(initCommand);

program
  .command("ask <question>")
  .description("Ask Elliot a question about your codebase")
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
