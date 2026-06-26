# Elliot-AI CLI — Setup (Local Agent)

Run Elliot as a coding agent directly in your terminal — it reads, writes, edits,
searches, and runs commands on your local project files.

## Prerequisites

- **Node.js 18+** — check with `node --version`
- A free API key (see step 3)

## Install

```bash
git clone https://github.com/khushishimpi-elliot/Elliot-AI.git
cd Elliot-AI/elliot-cli
npm install
npm run build
npm link          # registers the global `elliot-ai` command
```

## Configure your API key

Create a file named `.env` inside `elliot-cli/`:

```
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
```

You only need **one** key, but having both gives automatic fallback when one is
rate-limited. Get free keys (no credit card):

- **Gemini** (recommended, 1M tokens/day) — https://aistudio.google.com → *Get API key*
- **Groq** (fast, 100k tokens/day) — https://console.groq.com → *API Keys*

> `.env` is gitignored — your keys are never committed. Each person uses their own.

## Run

From **any** project folder you want Elliot to work in:

```bash
cd /path/to/your/project
elliot-ai local
```

## Commands inside the session

| Command    | What it does                          |
|------------|---------------------------------------|
| `/undo`    | Revert the last file change           |
| `/compact` | Trim history when context gets long   |
| `/clear`   | Wipe the conversation                 |
| `/exit`    | Quit                                  |

## What it can do

- **Understand** — "what is this project about", "explain how auth works"
- **Write/edit code** — "add input validation to the login function"
- **Debug** — "run the tests and fix what's failing"
- **Search** — "find all API endpoints", "where is X defined"
- **Run commands** — git, npm, build, test (asks before destructive ones)

## Troubleshooting

- **`No API key found`** → check `elliot-cli/.env` exists and has a valid key
- **`All providers unavailable`** → daily free quota hit; add the other provider's key, or wait
- **`elliot-ai` not found** → re-run `npm link` inside `elliot-cli/`
