# Publishing Elliot-AI CLI to npm

Complete guide for publishing Elliot-AI CLI to the npm registry.

---

## Prerequisites

- npm account at https://www.npmjs.com
- npm CLI configured with authentication token
- Commit all changes to main branch
- Updated version in `elliot-cli/package.json`

---

## Step 1: Update Version

Update the version in `elliot-cli/package.json`:

```bash
cd elliot-cli
npm version minor  # or patch, or major
```

This will:
- Update the version in package.json
- Create a git commit
- Create a git tag (e.g., v1.0.1)
- Push the tag

Or manually update and commit:

```bash
# Edit elliot-cli/package.json version field
git add elliot-cli/package.json
git commit -m "chore: bump version to 1.0.1"
git tag -a v1.0.1 -m "Release: Elliot-AI CLI v1.0.1"
git push origin main
git push origin v1.0.1
```

---

## Step 2: Setup npm Authentication

### Option A: npm login (Interactive)

```bash
npm login
# Enter username, password, email, OTP
```

### Option B: npm token (CI/GitHub Actions)

Create token at https://www.npmjs.com/settings/tokens

Create GitHub secret `NPM_TOKEN` with the token value.

GitHub Actions will use this automatically.

---

## Step 3: Build and Publish

### Local Publishing

```bash
cd elliot-cli

# Clean build
npm run build

# Verify package contents
npm pack

# Publish to npm
npm publish
```

### GitHub Actions (Automatic)

When you push a git tag starting with `v`:

```bash
git push origin v1.0.1
```

The workflow will automatically:
1. Build TypeScript
2. Run tests (if configured)
3. Publish to npm registry
4. Create GitHub Release

---

## Step 4: Verify Publication

### Check npm Registry

```bash
npm view elliot-ai

# Or visit:
# https://www.npmjs.com/package/elliot-ai
```

### Test Installation

```bash
npm install -g elliot-ai
elliot-ai --version
elliot-ai --help
```

---

## What Gets Published

From `elliot-cli/package.json` `files` field:

```json
"files": [
  "dist",
  "bin",
  "README.md"
]
```

This includes:
- ✅ Compiled TypeScript in `dist/`
- ✅ Entrypoint script `bin/elliot.js`
- ✅ README documentation

Excluded:
- ❌ `src/` (source TypeScript)
- ❌ `node_modules/` (dependencies resolved by npm)
- ❌ `scripts/` (build scripts)
- ❌ Test files and config

---

## Package Metadata

From `package.json`:

```json
{
  "name": "elliot-ai",
  "version": "1.0.0",
  "description": "Interactive AI coding assistant for engineering teams",
  "author": "Elliot Systems",
  "license": "MIT",
  "homepage": "https://github.com/khushishimpi-elliot/Elliot-AI",
  "repository": { "url": "https://github.com/khushishimpi-elliot/Elliot-AI.git" },
  "bin": { "elliot-ai": "./dist/index.js" },
  "engines": { "node": ">=18.0.0" }
}
```

---

## Version Numbering

Use semantic versioning:

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (1.1.0): New features, backwards compatible
- **PATCH** (1.0.1): Bug fixes, backwards compatible

Examples:
- `1.0.0`: Initial release
- `1.1.0`: Add new commands
- `1.0.1`: Fix CLI bug
- `2.0.0`: Redesign UI

---

## GitHub Actions Workflow

File: `.github/workflows/build-cli-release.yml`

Triggered by: Git tags matching `v*`

Steps:
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Build TypeScript
5. Publish to npm (using `NPM_TOKEN` secret)
6. Create GitHub Release

---

## Troubleshooting

### npm ERR! 403 You do not have permission

**Problem**: npm token not set or invalid

**Solution**:
```bash
npm logout
npm login
# Or create new token at https://www.npmjs.com/settings/tokens
```

### npm ERR! 409 Conflict: Version already published

**Problem**: Version already exists on npm

**Solution**:
```bash
# Increment version in package.json
npm version patch
git push origin v1.x.x
```

### npm ERR! EACCES: permission denied

**Problem**: Global install permission issue

**Solution**:
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Or use sudo (not recommended)
sudo npm install -g elliot-ai
```

---

## Developer Installation (Post-Publish)

After publishing to npm, developers can install with:

```bash
npm install -g elliot-ai
elliot-ai init
elliot-ai
```

Or use without installing:

```bash
npx elliot-ai init
npx elliot-ai
```

---

## Updates and Releases

### For New Features

```bash
cd elliot-cli
npm version minor
git push origin main
git push origin v1.1.0
```

### For Bug Fixes

```bash
cd elliot-cli
npm version patch
git push origin main
git push origin v1.0.1
```

### For Major Changes

```bash
cd elliot-cli
npm version major
git push origin main
git push origin v2.0.0
```

---

## Publishing Checklist

- [ ] All changes committed
- [ ] Version updated in package.json
- [ ] TypeScript builds without errors
- [ ] CLI tested locally (`npm install -g ./elliot-cli`)
- [ ] Commands work: `elliot-ai --help`
- [ ] Git tag created and pushed
- [ ] npm account authenticated
- [ ] `NPM_TOKEN` set in GitHub secrets (for CI)
- [ ] Verify on https://www.npmjs.com/package/elliot-ai

---

## References

- [npm Package Publishing](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages)
- [npm Semantic Versioning](https://docs.npmjs.com/about-semantic-versioning)
- [npm package.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/khushishimpi-elliot/Elliot-AI/issues
- npm Package: https://www.npmjs.com/package/elliot-ai
