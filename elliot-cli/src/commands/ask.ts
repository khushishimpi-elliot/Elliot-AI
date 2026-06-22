import { isConfigured, readConfig } from "../config";
import { printQuery, printThinking, printError, printInfo } from "../display";
import { streamQuery } from "../stream";

export async function askCommand(question: string): Promise<void> {
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

    printQuery(question);
    const spinner = printThinking();

    try {
      await streamQuery(question, config);
      spinner.stop();
    } catch {
      spinner.stop();
      throw new Error("Failed to stream response");
    }
  } catch (error) {
    if (error instanceof Error) {
      printError(error.message);
    } else {
      printError("Ask failed");
    }
    process.exit(1);
  }
}
