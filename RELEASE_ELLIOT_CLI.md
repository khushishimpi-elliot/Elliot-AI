# 🚀 Releasing Elliot-AI CLI v1.0.0

Complete step-by-step guide for releasing the first version.

---

## Step 1: Pre-Release Checklist

- [ ] All tests passing
- [ ] No uncommitted changes
- [ ] Latest code merged to main
- [ ] CLI tested locally on Windows, Mac, Linux
- [ ] Web UI tested with installation flow
- [ ] Documentation complete (README.md, DEPLOYMENT_GUIDE.md)

---

## Step 2: Build Standalone Binaries Locally (Test)

```bash
cd elliot-cli

# Build TypeScript
npm run build

# Build standalone executables for all platforms
node scripts/build-standalone.js
```

**Verify binaries exist:**
```bash
ls -lh dist-standalone/
# elliot-ai.exe      (Windows)
# elliot-ai-macos    (macOS)
# elliot-ai-linux    (Linux)
```

---

## Step 3: Test Binaries Locally

### Windows
```powershell
# In PowerShell as Administrator
.\dist-standalone\elliot-ai.exe --help
.\dist-standalone\elliot-ai.exe init
```

### macOS
```bash
chmod +x dist-standalone/elliot-ai-macos
./dist-standalone/elliot-ai-macos --help
./dist-standalone/elliot-ai-macos init
```

### Linux
```bash
chmod +x dist-standalone/elliot-ai-linux
./dist-standalone/elliot-ai-linux --help
./dist-standalone/elliot-ai-linux init
```

---

## Step 4: Create GitHub Release

### Option A: Using Git CLI

```bash
# Verify clean repo
git status

# Create tag
git tag -a v1.0.0 -m "Release: Elliot-AI CLI v1.0.0

Features:
- Interactive TUI with token streaming
- One-click installer for Windows, macOS, Linux
- Standalone executables (no Node.js required)
- Auto-setup and configuration
- Full context awareness from codebase

See DEPLOYMENT_GUIDE.md for details."

# Push tag to GitHub
git push origin v1.0.0
```

### Option B: Using GitHub UI

1. Go to https://github.com/khushishimpi-elliot/Elliot-AI/releases
2. Click "Draft a new release"
3. Tag version: `v1.0.0`
4. Release title: `Release: Elliot-AI CLI v1.0.0`
5. Paste release notes (see below)
6. Attach binaries manually:
   - dist-standalone/elliot-ai.exe
   - dist-standalone/elliot-ai-macos
   - dist-standalone/elliot-ai-linux
   - elliot-cli/scripts/install-windows.ps1
   - elliot-cli/scripts/install-unix.sh
7. Publish

---

## Step 5: GitHub Actions Builds Automatically

When you push the tag, GitHub Actions runs automatically:

1. **Build Phase** (3-5 minutes)
   - Builds Windows executable
   - Builds macOS executable
   - Builds Linux executable
   - Uploads to release

2. **Status**: Watch at
   ```
   https://github.com/khushishimpi-elliot/Elliot-AI/actions
   ```

3. **Verify Release**:
   ```
   https://github.com/khushishimpi-elliot/Elliot-AI/releases/tag/v1.0.0
   ```

---

## Step 6: Verify Release Downloads

```bash
# Get download links from release page
# Example: https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0/

# Test Windows download
curl -L -O https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0/elliot-ai.exe

# Test macOS download
curl -L -O https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0/elliot-ai-macos

# Test Linux download
curl -L -O https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0/elliot-ai-linux

# Verify they're executable
./elliot-ai-macos --help
./elliot-ai-linux --help
```

---

## Step 7: Test Web UI Installation Flow

1. Open: https://elliot-ai-terminal.onrender.com
2. Complete onboarding (Steps 1-6)
3. Click "Setup & Launch Terminal" button
4. Should show instructions to download installer
5. Link should open GitHub releases
6. Download appropriate installer for your OS

---

## Step 8: Test Installation Scripts

### Windows
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\install-windows.ps1
```

### macOS/Linux
```bash
chmod +x install-unix.sh
./install-unix.sh
```

**Verify installation:**
```bash
elliot-ai --help
elliot-ai init
```

---

## Release Notes Template

```markdown
# Elliot-AI CLI v1.0.0

🎉 Initial release of the Elliot-AI CLI - an AI coding assistant for your terminal.

## ✨ Features

- **Interactive Terminal UI** — Real-time token streaming, animated thinking indicator
- **One-Click Installation** — Automatic installer for Windows, macOS, and Linux
- **Standalone Executables** — No Node.js or npm required
- **Full Context Awareness** — Understands your entire codebase
- **Browser-Based Setup** — 6-step onboarding via web UI
- **Persistent Configuration** — Works from any terminal after setup

## 📥 Installation

### Windows
1. Download `install-windows.ps1` from this release
2. Run in PowerShell as Administrator:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
   .\install-windows.ps1
   ```

### macOS / Linux
1. Download `install-unix.sh` from this release
2. Run in Terminal:
   ```bash
   chmod +x install-unix.sh
   ./install-unix.sh
   ```

## 🚀 Quick Start

```bash
# First time setup
elliot-ai init

# Open interactive TUI
elliot-ai

# Check status
elliot-ai status

# Disconnect
elliot-ai logout
```

## 📦 What's Included

- `elliot-ai.exe` — Windows executable
- `elliot-ai-macos` — macOS executable
- `elliot-ai-linux` — Linux executable
- `install-windows.ps1` — Windows installer script
- `install-unix.sh` — macOS/Linux installer script

## 🔧 System Requirements

- Windows 7+, macOS 10.13+, or Linux (glibc 2.28+)
- 50MB disk space
- Internet connection

## 📖 Documentation

- [README.md](https://github.com/khushishimpi-elliot/Elliot-AI/blob/main/elliot-cli/README.md) — Usage guide
- [DEPLOYMENT_GUIDE.md](https://github.com/khushishimpi-elliot/Elliot-AI/blob/main/elliot-cli/DEPLOYMENT_GUIDE.md) — Technical details

## 🐛 Known Issues

None identified in initial release.

## 🤝 Contributing

Report issues at: https://github.com/khushishimpi-elliot/Elliot-AI/issues

---

Made with ❤️ by Elliot Systems
```

---

## Step 9: Announce Release

1. **GitHub Releases**: Add to release page
2. **README.md**: Update to point to latest release
3. **Slack/Email**: Announce to team
4. **Documentation**: Update installation links

---

## Post-Release Verification

### Check downloads:
```bash
# Visit release page
https://github.com/khushishimpi-elliot/Elliot-AI/releases/tag/v1.0.0

# Should show:
✅ elliot-ai.exe (Windows binary)
✅ elliot-ai-macos (macOS binary)
✅ elliot-ai-linux (Linux binary)
✅ install-windows.ps1 (Windows installer)
✅ install-unix.sh (Mac/Linux installer)
```

### Test web UI:
- Visit https://elliot-ai-terminal.onrender.com
- Complete setup
- Click "Setup & Launch Terminal"
- Should link to GitHub releases

### Test installation:
- Download installer for your OS
- Run installer
- Verify `elliot-ai --help` works
- Run `elliot-ai init`
- Verify TUI opens

---

## Rollback (if needed)

```bash
# Delete the tag locally
git tag -d v1.0.0

# Delete the tag on GitHub
git push origin --delete v1.0.0

# Delete the release on GitHub (manual via UI)
```

---

## Next Releases

For future versions:

```bash
# Update version in package.json
npm version minor  # or patch, or major

# Create tag
git tag -a v1.1.0 -m "Release: v1.1.0"

# Push (GitHub Actions handles the rest)
git push origin v1.1.0
```

---

## Support

For release issues:
- Check GitHub Actions at: https://github.com/khushishimpi-elliot/Elliot-AI/actions
- Review DEPLOYMENT_GUIDE.md
- Check release notes
- File an issue: https://github.com/khushishimpi-elliot/Elliot-AI/issues

---

## Release Checklist Summary

```
[ ] Pre-release testing complete
[ ] Binaries built locally
[ ] Binaries tested on all platforms
[ ] Git tag created: v1.0.0
[ ] Tag pushed to GitHub
[ ] GitHub Actions completes successfully
[ ] Release downloads verified
[ ] Web UI installation flow tested
[ ] Installation scripts tested
[ ] Release notes published
[ ] Team announced
[ ] Documentation updated
```

You're ready to release! 🚀
