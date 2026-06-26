import * as readline from "readline";
import open from "open";
import { isConfigured, readConfig, writeConfig, ElliotConfig } from "../config.js";
import {
  printWelcome,
  printSuccess,
  printError,
  printInfo,
} from "../display.js";
import { startCallbackServer, getCallbackPort } from "../callback.js";

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

export async function initCommand(): Promise<void> {
  try {
    if (isConfigured()) {
      const config = readConfig();
      const answer = await askQuestion(
        `Already configured for ${config?.org_name}. Reset? (y/n): `
      );
      if (answer !== "y" && answer !== "yes") {
        printInfo("Setup cancelled.");
        return;
      }
    }

    printWelcome();
    printInfo("Starting Elliot-AI setup...");

    const port = await getCallbackPort();
    printInfo(`Starting callback server on http://localhost:${port}...`);

    const callbackUrl = encodeURIComponent(`http://localhost:${port}/callback`);
    const onboardingUrl = `https://elliot-ai-1.onrender.com?callback=${callbackUrl}&source=cli`;

    printInfo("Opening browser for setup...");
    printInfo("Complete the 6-step onboarding in your browser.");
    printInfo(
      "This window will update automatically when done."
    );
    printInfo(`Browser URL: ${onboardingUrl}`);
    printInfo("");

    await open(onboardingUrl);

    const config = await startCallbackServer();
    config.configured_at = new Date().toISOString();

    writeConfig(config);

    printSuccess("Elliot-AI configured successfully!");
    printInfo(`Organisation: ${config.org_name}`);
    printInfo(`Stack: ${config.stack}`);
    printInfo(`Backend: ${config.backend_url}`);
    printInfo("");
    printInfo(`Next: elliot ask "how does auth work?"`);
    printInfo("");
  } catch (error) {
    if (error instanceof Error) {
      printError(error.message);
    } else {
      printError("Setup failed");
    }
    process.exit(1);
  }
}
