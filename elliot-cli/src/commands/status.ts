import { isConfigured, readConfig } from "../config.js";
import { printError, printInfo } from "../display.js";
import { checkBackendHealth, getConnectorStatus } from "../api.js";

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function statusCommand(): Promise<void> {
  try {
    if (!isConfigured()) {
      printError("Not configured. Run 'elliot init' first");
      process.exit(1);
    }

    const config = readConfig();
    if (!config) {
      printError("Failed to read config");
      process.exit(1);
    }

    printInfo("");
    printInfo("✅ Elliot-AI Status");
    printInfo("─────────────────────────────");
    printInfo(`Organisation:  ${config.org_name}`);
    printInfo(`Stack:         ${config.stack}`);

    const backendHealthy = await checkBackendHealth(config.backend_url);
    const backendStatus = backendHealthy ? "✅ Online" : "❌ Offline";
    printInfo(`Backend:       ${backendStatus}`);

    printInfo("─────────────────────────────");
    printInfo("Connectors:");

    const connectors = await getConnectorStatus(config);
    if (Object.keys(connectors).length === 0) {
      printInfo("  (No connector data available)");
    } else {
      for (const [name, connected] of Object.entries(connectors)) {
        const status = connected ? "✅ connected" : "❌ not connected";
        const displayName = name.charAt(0).toUpperCase() + name.slice(1);
        printInfo(`  ${displayName.padEnd(10)} ${status}`);
      }
    }

    printInfo("─────────────────────────────");
    printInfo(`Configured:    ${formatDate(config.configured_at)}`);
    printInfo("");
  } catch (error) {
    if (error instanceof Error) {
      printError(error.message);
    } else {
      printError("Status check failed");
    }
    process.exit(1);
  }
}
