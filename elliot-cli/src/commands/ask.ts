import React from "react";
import { render } from "ink";
import { isConfigured, readConfig } from "../config.js";
import { printError, printInfo } from "../display.js";
import { checkBackendHealth, getConnectorStatus, getIndexStats } from "../api.js";
import App from "../ui/App.js";

export async function askCommand(): Promise<void> {
  try {
    if (!isConfigured()) {
      printError("Not configured. Run 'elliot-ai init' first");
      process.exit(1);
    }

    const config = readConfig();
    if (!config) {
      printError("Failed to read config");
      process.exit(1);
    }

    printInfo("Connecting to Elliot-AI...");

    const backendHealthy = await checkBackendHealth(config.backend_url);
    const connectors = await getConnectorStatus(config);
    const stats = await getIndexStats(config);

    render(
      React.createElement(App, {
        config,
        connectors,
        chunkCount: stats.total_chunks,
        backendHealthy,
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      printError(error.message);
    } else {
      printError("Failed to start TUI");
    }
    process.exit(1);
  }
}
