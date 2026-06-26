import * as readline from "readline";
import open from "open";
import { isConfigured, readConfig, writeConfig, ElliotConfig } from "../config.js";
import {
  printWelcome,
  printSuccess,
  printError,
  printInfo,
} from "../display.js";
import { startCallbackServer } from "../callback.js";

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
    printInfo("Starting callback server on http://localhost:3333...");

    const callbackUrl = encodeURIComponent("http://localhost:3333/callback");
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

    // Generate AGENT.md for the current project (non-fatal)
    try {
      const { writeAgentContext } = await import("../agent/context.js");
      const { AgentLoop } = await import("../agent/loop.js");
      await import("../tools/read.js");
      await import("../tools/write.js");
      await import("../tools/edit.js");
      await import("../tools/bash.js");
      await import("../tools/grep.js");
      await import("../tools/glob.js");

      printInfo("Analyzing project for AGENT.md...");
      const initLoop = new AgentLoop("");
      let agentMdContent = "";
      await initLoop.run(
        `Analyze this project directory. Produce a concise markdown document (max 400 words) covering:
1. What this project does
2. Tech stack and key dependencies
3. Directory structure (key folders only)
4. How to run, test, and build
5. Coding conventions observed

Output only the markdown content, no preamble.`,
        (text) => { agentMdContent += text; },
        () => {},
        () => {}
      );
      if (agentMdContent.trim()) {
        await writeAgentContext(agentMdContent);
        printSuccess("AGENT.md created — commit this file to share project context with your team.");
      }
    } catch (err) {
      printInfo(`Note: could not generate AGENT.md: ${(err as Error).message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      printError(error.message);
    } else {
      printError("Setup failed");
    }
    process.exit(1);
  }
}
