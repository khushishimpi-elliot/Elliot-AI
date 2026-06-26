import * as readline from "readline";
import { isConfigured, readConfig, clearConfig } from "../config.js";
import { printError, printSuccess, printInfo } from "../display.js";

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

export async function logoutCommand(): Promise<void> {
  try {
    if (!isConfigured()) {
      printError("Not configured");
      process.exit(1);
    }

    const config = readConfig();
    if (!config) {
      printError("Failed to read config");
      process.exit(1);
    }

    const answer = await askQuestion(
      `Logout from ${config.org_name}? (y/n): `
    );
    if (answer !== "y" && answer !== "yes") {
      printInfo("Logout cancelled.");
      return;
    }

    clearConfig();
    printSuccess("Logged out. Run 'elliot-ai init' to reconnect.");
    printInfo("");
  } catch (error) {
    if (error instanceof Error) {
      printError(error.message);
    } else {
      printError("Logout failed");
    }
    process.exit(1);
  }
}
