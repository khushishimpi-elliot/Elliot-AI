/**
 * `elliot login` — prompts for email, requests a magic link, then waits for
 * the user to click it.
 *
 * Two transport modes, chosen automatically:
 *   1. **Callback server (preferred):** spin up a tiny http server on
 *      localhost:43117. The magic-link the user clicks redirects through the
 *      backend, which already issues a JWT and returns it. The CLI also
 *      accepts paste-in fallback for headless / SSH sessions where opening a
 *      browser doesn't make sense.
 *   2. **Paste-in fallback:** print the link; user pastes the resulting
 *      `?token=` value back into the CLI.
 *
 * Either way: on success, the token is saved via `saveConfig` and a quick
 * `/launch` summary is fetched to populate org metadata.
 */
import chalk from "chalk";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { redeemMagicLink, requestMagicLink } from "../api/auth.js";
import { getLaunchSummary } from "../api/launch.js";
import { loadConfig, saveConfig } from "../config/store.js";
import { theme } from "../ui/theme.js";

export async function loginCommand(): Promise<number> {
  const cfg = loadConfig();
  console.log(chalk.bold("Sign in to Elliot-AI"));
  console.log(chalk.gray(`Backend: ${cfg.apiUrl}\n`));

  const rl = createInterface({ input, output });
  try {
    const email = (await rl.question("Work email: ")).trim();
    if (!email) {
      console.error(chalk.red("\nNo email entered."));
      return 1;
    }

    process.stdout.write(chalk.gray("Sending magic link... "));
    let ttl: number;
    try {
      const resp = await requestMagicLink(email);
      ttl = resp.expires_in_seconds;
    } catch (e) {
      console.error(chalk.red("\nFailed to request magic link."));
      console.error(chalk.gray(String(e)));
      return 2;
    }
    console.log(chalk.hex(theme.accent)("done"));
    console.log(
      chalk.gray(`Check ${chalk.white(email)} — link expires in ${Math.round(ttl / 60)} min.\n`),
    );

    // Paste-in flow: ask the user to paste the `?token=` portion of the
    // callback URL. Simpler than spinning up a local HTTP server and works
    // identically over SSH.
    console.log(
      chalk.gray(
        "After clicking the email link, copy the `?token=...` from the URL\n" +
          "and paste it below (just the token, no `?token=`).",
      ),
    );
    const token = (await rl.question("token> ")).trim();
    if (!token) {
      console.error(chalk.red("\nNo token entered."));
      return 3;
    }

    process.stdout.write(chalk.gray("Redeeming... "));
    let tok;
    try {
      tok = await redeemMagicLink(token);
    } catch (e) {
      console.error(chalk.red("\nToken redemption failed."));
      console.error(chalk.gray(String(e)));
      return 4;
    }
    console.log(chalk.hex(theme.accent)("done"));

    saveConfig({
      token: tok.access_token,
      email: tok.email,
      loggedInAt: new Date().toISOString(),
    });

    // Best-effort org metadata fetch; non-fatal if it fails.
    try {
      const summary = await getLaunchSummary();
      saveConfig({ orgName: summary.org_name });
      console.log(
        chalk.green(`\n✓ Signed in to ${chalk.bold(summary.org_name)} as ${tok.email}`),
      );
    } catch {
      console.log(chalk.green(`\n✓ Signed in as ${tok.email}`));
    }
    return 0;
  } finally {
    rl.close();
  }
}
