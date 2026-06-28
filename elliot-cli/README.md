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

Works immediately with a free Gemini API key.

**1. Get a free API key**

Go to [aistudio.google.com](https://aistudio.google.com) → **Get API key** (no credit card required)

**2. Add it to `.env`**

Create `elliot-cli/.env`:
```
GEMINI_API_KEY=AIzaSy...
```

**3. Run**

```bash
elliot-ai local
```

Elliot will read, write, and search files in whatever directory you run it from.

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
| `elliot-ai logout` | Disconnect from organization |
| `elliot-ai local` | **Local mode** — coding agent using Gemini, no backend needed |
| `elliot-ai --help` | Show all commands |

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

- ✨ **Real-time streaming** — Responses appear token-by-token
- 🎯 **Full context** — Understands your codebase, standards, and team
- 🔍 **Source attribution** — See which files/docs informed the response
- ⚡ **Multi-agent reasoning** — Parallel analysis from different angles
- 💾 **Persistent config** — One-time setup, use from anywhere
- 🌈 **Beautiful TUI** — Clean, intuitive terminal interface

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
- Free Gemini API key (for `local` mode) — [aistudio.google.com](https://aistudio.google.com)
- Browser (for `init` full setup only)

## Support

For issues or feedback:
- GitHub: <repository-issues>
- Documentation: <docs-url>

## License

© Elliot Systems. All rights reserved.
