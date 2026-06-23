/**
 * `elliot` entry point.
 *
 *   elliot               -> interactive REPL (Ink TUI)
 *   elliot login         -> magic-link auth flow
 *   elliot logout        -> wipe stored token
 *   elliot status        -> show config + backend health
 *   elliot ask <query>   -> one-shot query (non-interactive)
 *   elliot --version
 *   elliot --help
 */
import { Command } from "commander";

const program = new Command();

program
  .name("elliot")
  .description("Elliot-AI CLI — ask your codebase anything")
  .version("0.1.0");

program
  .command("login")
  .description("Sign in via magic link")
  .action(async () => {
    const { loginCommand } = await import("./commands/login.js");
    process.exit(await loginCommand());
  });

program
  .command("logout")
  .description("Clear the stored auth token")
  .action(async () => {
    const { logoutCommand } = await import("./commands/logout.js");
    process.exit(await logoutCommand());
  });

program
  .command("status")
  .description("Show config, auth state, and backend health")
  .action(async () => {
    const { statusCommand } = await import("./commands/status.js");
    process.exit(await statusCommand());
  });

program
  .command("ask <query...>")
  .description("Single-shot query")
  .action(async (parts: string[]) => {
    const { askCommand } = await import("./commands/ask.js");
    process.exit(await askCommand(parts.join(" ")));
  });

// Default action: no subcommand -> launch the REPL.
program.action(async () => {
  const { replCommand } = await import("./commands/repl.js");
  process.exit(await replCommand());
});

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
