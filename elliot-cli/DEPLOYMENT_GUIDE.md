# Elliot-AI CLI Deployment Guide

## 🚀 One-Click Installation System

The Elliot-AI CLI uses **standalone executables** - no Node.js installation required. Developers get the full experience with a single click.

---

## Architecture

```
Developer Flow:
1. Visits web UI: https://elliot-ai-1.onrender.com
2. Completes 6-step onboarding
3. Clicks "Setup & Launch Terminal"
4. Web UI downloads appropriate installer (Windows/Mac/Linux)
5. Installer runs, adds elliot-ai to PATH
6. CLI automatically opens setup
7. Done - developer can run "elliot-ai" anytime
```

---

## Building Standalone Binaries

### Prerequisites
```bash
npm install -g pkg
```

### Build for All Platforms
```bash
cd elliot-cli
npm install
npm run build

# Build standalone binaries (Windows/Mac/Linux)
node scripts/build-standalone.js
```

### Output
```
dist-standalone/
├── elliot-ai.exe          # Windows executable
├── elliot-ai-macos        # macOS executable
└── elliot-ai-linux        # Linux executable
```

---

## Installer Scripts

### Windows (`install-windows.ps1`)
- Downloads `elliot-ai.exe`
- Installs to `C:\Program Files\elliot-ai`
- Adds to System PATH
- Launches `elliot-ai init`

**Usage:**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\install-windows.ps1
```

### macOS/Linux (`install-unix.sh`)
- Downloads appropriate binary
- Installs to `/usr/local/bin`
- Makes executable
- Launches `elliot-ai init`

**Usage:**
```bash
chmod +x install-unix.sh
./install-unix.sh
```

---

## GitHub Actions Release Pipeline

### Trigger Release
```bash
# Tag a new version
git tag v1.0.0
git push origin v1.0.0
```

### Workflow (`.github/workflows/build-cli-release.yml`)
1. **Build Phase**: Builds binaries for Windows, macOS, Linux
2. **Upload Phase**: Uploads artifacts to release
3. **Release Phase**: Creates GitHub Release with installers
4. **Download URLs**: 
   ```
   https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0/elliot-ai.exe
   https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0/elliot-ai-macos
   https://github.com/khushishimpi-elliot/Elliot-AI/releases/download/v1.0.0/elliot-ai-linux
   ```

---

## Web UI Integration

### Step 6: "Setup & Launch Terminal" Button

The web UI detects the developer's OS and:

1. **Detects OS**
   ```javascript
   const ua = navigator.userAgent.toLowerCase();
   if (ua.includes("win")) os = "windows";
   if (ua.includes("mac")) os = "macos";
   if (ua.includes("linux")) os = "linux";
   ```

2. **Downloads Installer**
   ```javascript
   const installerUrl = `https://github.com/.../releases/download/v1.0.0/install-${os}.sh`;
   fetch(installerUrl).then(r => r.text())
   ```

3. **Triggers Download**
   ```javascript
   const blob = new Blob([scriptContent], { type: "text/plain" });
   const a = document.createElement("a");
   a.href = URL.createObjectURL(blob);
   a.download = "install-elliot-ai.sh";
   a.click();
   ```

4. **Shows Instructions**
   - Windows: Run PowerShell script as Administrator
   - Mac/Linux: Run shell script with chmod +x

---

## Complete Developer Experience

### Step 1: Visit Web UI
```
https://elliot-ai-1.onrender.com
```

### Step 2: Complete Onboarding
```
Step 1: Sign in (SSO)
Step 2: Workspace (org info)
Step 3: SDLC Profile (stack)
Step 4: Connect Sources (repos, jira, etc)
Step 5: Index Knowledge (wait for indexing)
Step 6: Setup & Launch Terminal ← CLICK HERE
```

### Step 3: Auto-Install
```
✅ Installer downloaded
✅ CLI installed to PATH
✅ Browser opens setup
❌ Complete 6-step onboarding in CLI
✅ Terminal ready!
```

### Step 4: Use CLI
```bash
# Works from any terminal
elliot-ai              # Open interactive TUI
elliot-ai init         # Re-run setup
elliot-ai status       # Check connection
elliot-ai logout       # Disconnect
```

---

## File Structure

```
elliot-cli/
├── bin/
│   └── elliot.js              # Entry point
├── src/
│   └── ...                    # TypeScript source
├── dist/                      # Compiled JS
├── dist-standalone/           # Built executables
│   ├── elliot-ai.exe          # Windows
│   ├── elliot-ai-macos        # macOS
│   └── elliot-ai-linux        # Linux
├── scripts/
│   ├── build-standalone.js    # Build script
│   ├── install-windows.ps1    # Windows installer
│   └── install-unix.sh        # Mac/Linux installer
├── package.json
├── tsconfig.json
└── README.md
```

---

## Troubleshooting

### Windows: "Execution Policy" Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force
.\install-windows.ps1
```

### Mac/Linux: Permission Denied
```bash
chmod +x install-elliot-ai.sh
./install-elliot-ai.sh
```

### CLI Not Found After Install
- **Windows**: Restart PowerShell/CMD
- **Mac/Linux**: `export PATH=/usr/local/bin:$PATH`

### Re-install or Update
```bash
elliot-ai logout
elliot-ai init
```

---

## Versioning

### Semantic Versioning
- `1.0.0` - Major.Minor.Patch
- Tag format: `v1.0.0`
- Each release creates GitHub Release with binaries

### Update Flow
```bash
# Developer runs
elliot-ai init

# If new version available, suggests update
# They download new installer and re-run
```

---

## Security Considerations

1. **Code Signing** (Future)
   - Sign Windows .exe files
   - Sign macOS binaries
   - Verify checksums

2. **HTTPS Download**
   - All downloads from GitHub (HTTPS)
   - Releases are signed

3. **No Credentials in Binary**
   - JWT stored in `~/.elliot/config.json`
   - Not bundled in binary

---

## Performance

- **Binary Size**: ~50-70MB per platform
- **Install Time**: <1 minute
- **Startup Time**: <500ms
- **No external dependencies**: Pure Node.js bundled

---

## Next Steps

1. **Test locally**
   ```bash
   npm run build
   node scripts/build-standalone.js
   ```

2. **Create release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **GitHub Actions builds automatically**

4. **Update release notes** with installation links

5. **Test installers** on Windows, Mac, Linux

---

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run `npm run build && node scripts/build-standalone.js`
- [ ] Test binaries locally on all platforms
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] GitHub Actions builds binaries
- [ ] Verify release on GitHub
- [ ] Test web UI download/install flow
- [ ] Announce release

---

## References

- [pkg - Package Node.js Projects](https://github.com/vercel/pkg)
- [GitHub Releases API](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [GitHub Actions](https://docs.github.com/en/actions)
