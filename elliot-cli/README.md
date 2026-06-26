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

### 1. First Time Setup

Run the interactive onboarding:

```bash
elliot-ai init
```

This will:
- Open your browser for 6-step setup
- Connect your repositories (GitHub, GitLab, etc.)
- Connect your knowledge sources (Jira, Confluence, etc.)
- Automatically configure your CLI
- Return to terminal ready to use

### 2. Open the Interactive TUI

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
| `elliot-ai` | Open interactive TUI |
| `elliot-ai init` | Complete setup wizard |
| `elliot-ai ask "query"` | Ask a specific question |
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
- Active internet connection
- Browser (for initial setup only)

## Support

For issues or feedback:
- GitHub: <repository-issues>
- Documentation: <docs-url>

## License

© Elliot Systems. All rights reserved.
