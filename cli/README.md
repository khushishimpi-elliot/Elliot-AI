# `@elliot-ai/cli`

The Elliot-AI command-line client. Talk to your codebase from the terminal.

## Install

```bash
npm install -g @elliot-ai/cli
```

Requires Node 20+.

## First-time setup

```bash
elliot login         # work email -> magic link -> paste token
elliot status        # confirm you're signed in + backend reachable
```

By default the CLI hits the production backend. Override with:
```bash
ELLIOT_API_URL=http://localhost:8000 elliot status
```

Config + token are stored in `~/.elliot/config.json` (mode 0600).

## Commands

| Command | What it does |
|---|---|
| `elliot` | Interactive REPL (Ink TUI). Type questions, get answers, ↑/↓ for history, `/help`, `/clear`, `/quit`. |
| `elliot ask "<query>"` | Single-shot query; prints the answer + token cost. |
| `elliot login` | Magic-link auth flow. |
| `elliot logout` | Wipe the stored token. |
| `elliot status` | Show config, signed-in user, backend health, indexed chunk count, connector list. |

## Develop

```bash
cd cli
npm install
npm run build
node bin/elliot.js status      # smoke test
npm link                       # makes `elliot` available globally
```

Or while iterating:
```bash
npm run dev    # tsc --watch
```

## Architecture

```
src/
├── index.tsx               argv parsing (commander)
├── commands/               one file per subcommand
├── api/                    fetch wrapper + endpoint helpers
├── config/store.ts         ~/.elliot/config.json
├── ui/components/          Ink components used by the REPL
└── utils/
```

The REPL is built on [Ink](https://github.com/vadimdemedes/ink) — React rendered into the terminal. All API calls go through `src/api/client.ts` so auth + base URL handling stays in one place.
