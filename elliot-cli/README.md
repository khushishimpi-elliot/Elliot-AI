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

```bash
elliot-ai init
```

This will:
- Open your browser for 6-step setup
- Connect your repositories (GitHub, GitLab, etc.)
- Connect your knowledge sources (Jira, Confluence, etc.)
- Automatically configure your CLI
- Return to terminal ready to use

```bash
elliot-ai ask
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
| `elliot-ai local` | **Local mode** — coding agent using Gemini, no backend needed |
| `elliot-ai init` | Full setup wizard (connects backend, Jira, GitHub, etc.) |
| `elliot-ai ask` | Interactive TUI (requires `init` first) |
| `elliot-ai status` | Check connection & connectors |
| `elliot-ai logout` | Disconnect from organization |
| `elliot-ai --help` | Show help |

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
