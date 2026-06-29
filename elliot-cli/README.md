# elliot-ai CLI

AI coding assistant for engineering teams — Interactive terminal UI

## Installation

### Option A: From Source (Development/Testing)

```bash
# Clone the repository
git clone <repository-url>
cd Elliot-AI/elliot-cli

# Install and build
npm install
npm run build

# Link globally
npm link

# Use from any directory
elliot-ai
```

### Option B: From npm (Once Published)

```bash
npm install -g elliot-ai
elliot-ai
```

## Getting Started

### Option A: Local Mode (no backend, no sign-in)

A standalone coding agent that reads, writes, edits, and searches files in
whatever directory you run it from — no sign-in required. It works with any of
three providers and automatically falls back to the next one if a model is rate
limited or unavailable.

**1. Get a free API key (any one of these works)**

| Provider | Where to get a key | Free tier |
|----------|--------------------|-----------|
| **Gemini** (default) | [aistudio.google.com](https://aistudio.google.com) → Get API key | Yes, no card required |
| **Groq** | [console.groq.com](https://console.groq.com) | Yes, resets hourly |
| **OpenRouter** | [openrouter.ai](https://openrouter.ai) | Yes, free Llama/Hermes models |

**2. Add it to `.env`**

Create `elliot-cli/.env` with whichever key(s) you have:
```
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
```

If you provide more than one, Elliot tries them in order (Gemini → Groq →
OpenRouter) and skips any that are out of quota. Keys can also live in
`~/.elliot/config.json` instead of `.env`.

**3. Run**

```bash
elliot-ai local
```

Inside the session you can switch models with `/model`, trim history with
`/compact`, and revert file changes with `/undo`.

---

### Option B: Full Setup (backend + connectors)

Connects to your organisation's repositories, Jira, Slack, etc.

**Step 1: Complete onboarding in browser**

Go to [https://elliot-ai-1.onrender.com](https://elliot-ai-1.onrender.com)

Complete the 6-step onboarding:
1. Sign in with your workspace SSO
2. Create workspace (org name, team size)
3. Configure SDLC standards
4. Connect repositories & knowledge sources
5. Index your codebase
6. Launch → Copy the setup command

**Step 2: Auto-configure CLI**

When you reach Step 6, you'll see your personalized setup command:
```bash
elliot-ai setup --token eyJ... --tenant-id 550e8400-...
```

Copy and paste this command in your terminal. Your CLI is now auto-configured!

**Step 3: Start using Elliot**

```bash
elliot-ai
```

You'll see:
```
┌──────────────────────────────────────┐
│ ELLIOT-AI • Your Organization        │
│ TypeScript/Node • Backend ✅ online   │
├──────────────────────────────────────┤
│ Ask anything about your codebase.    │
├──────────────────────────────────────┤
│ > ask about your codebase...         │
└──────────────────────────────────────┘
```

Type your question and press Enter. Responses stream in real-time.

## Commands

| Command | Description |
|---------|-------------|
| `elliot-ai` | **Interactive mode** — ask questions about your codebase (requires setup) |
| `elliot-ai setup --token JWT --tenant-id ID` | **Auto-configure** from Step 6 onboarding token |
| `elliot-ai init` | Full setup wizard (opens browser, alternative to web UI) |
| `elliot-ai status` | Check backend connection & connector status |
| `elliot-ai usage` | Show today's token/query usage (`--date YYYY-MM-DD`, `--week`) |
| `elliot-ai logout` | Disconnect from organization |
| `elliot-ai local` | **Local mode** — standalone coding agent (Gemini/Groq/OpenRouter), no backend needed |
| `elliot-ai --help` | Show all commands |

### Slash commands (inside a session)

| Command | Description |
|---------|-------------|
| `/model` | Switch the active model/provider |
| `/compact` | Trim conversation history when context gets long |
| `/undo` | Revert the last file change (local mode) |
| `/usage` | Show token usage for the current session |

## Usage Examples

```bash
# Interactive mode (recommended)
elliot-ai

# Ask specific questions
elliot-ai ask "how does the auth system work?"
elliot-ai ask "what are the failing tests?"
elliot-ai ask "explain the database schema"

# Check status
elliot-ai status

# Disconnect
elliot-ai logout
```

## Features

**Backend mode**
- ✨ **Real-time streaming** — Responses appear token-by-token
- 🎯 **Full context** — Understands your codebase, standards, and team
- 🔍 **Source attribution** — See which files/docs informed the response
- ⚡ **Multi-agent reasoning** — Parallel analysis from different angles
- 💾 **Persistent config** — One-time setup, use from anywhere
- 🌈 **Beautiful TUI** — Clean, intuitive terminal interface

**Local mode**
- 🛠️ **Native tool calling** — Reads, writes, edits, greps, and globs files; runs shell commands
- 🔒 **Permission gating** — Approve, ask, or deny before any destructive action
- ↩️ **Undo** — Snapshot-based `/undo` reverts file changes
- 🔁 **Provider fallback** — Auto-switches across Gemini/Groq/OpenRouter on rate limits

## Configuration

Config stored at: `~/.elliot/config.json`

To reconfigure:
```bash
elliot-ai logout
elliot-ai init
```

## Requirements

- Node.js 18+
- npm or yarn
- A free API key for `local` mode — Gemini, Groq, or OpenRouter (any one works)
- Browser (for `init` full setup only)

## Support

For issues or feedback:
- GitHub: <repository-issues>
- Documentation: <docs-url>

## License

© Elliot Systems. All rights reserved.
