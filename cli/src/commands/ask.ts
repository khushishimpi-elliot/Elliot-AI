import chalk from "chalk";

import { ApiError } from "../api/client.js";
import { ask } from "../api/query.js";
import { isAuthenticated } from "../config/store.js";

export async function askCommand(query: string): Promise<number> {
  if (!isAuthenticated()) {
    console.error(chalk.red("Not signed in. Run `elliot login` first."));
    return 1;
  }
  if (!query.trim()) {
    console.error(chalk.red("Empty query."));
    return 2;
  }

  process.stdout.write(chalk.gray("Thinking... "));
  try {
    const t0 = Date.now();
    const resp = await ask(query);
    const ms = Date.now() - t0;
    process.stdout.write("\r" + " ".repeat(14) + "\r"); // clear "Thinking..."

    console.log(resp.answer);

    const meta: string[] = [];
    if (resp.model) meta.push(resp.model);
    if (resp.input_tokens != null && resp.output_tokens != null) {
      meta.push(`${resp.input_tokens}→${resp.output_tokens} tok`);
    }
    if (resp.cost_usd != null) meta.push(`$${resp.cost_usd.toFixed(4)}`);
    meta.push(`${ms}ms`);
    console.log(chalk.gray(`\n[${meta.join(" · ")}]`));

    if (resp.sources?.length) {
      console.log(chalk.gray("\nSources:"));
      for (const s of resp.sources.slice(0, 5)) {
        console.log(chalk.gray(`  ${s.source}  ${s.score.toFixed(2)}`));
      }
    }
    return 0;
  } catch (e) {
    process.stdout.write("\r" + " ".repeat(14) + "\r");
    if (e instanceof ApiError) {
      console.error(chalk.red(`Backend error: ${e.message}`));
      if (e.status === 401) {
        console.error(chalk.gray("Run `elliot login` to refresh your token."));
      }
    } else {
      console.error(chalk.red(String(e)));
    }
    return 3;
  }
}
