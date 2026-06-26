# Installation Guide

## For End Users

### Current (Development)

```bash
git clone https://github.com/khushishimpi-elliot/Elliot-AI.git
cd Elliot-AI/elliot-cli
npm install
npm run build
npm link

# Now use from anywhere
elliot-ai init
```

### Future (After npm Publishing)

```bash
npm install -g elliot-ai
elliot-ai init
```

## For Publishing to npm

### Prerequisites

1. Create npm account at https://www.npmjs.com/signup
2. Get team member with npm org access to add you
3. Setup 2FA on your npm account

### Publishing Steps

```bash
# 1. Navigate to CLI directory
cd elliot-cli

# 2. Ensure you're logged in
npm login

# 3. Update version in package.json (semantic versioning)
# e.g., 1.0.0 → 1.0.1 (patch), 1.1.0 (minor), 2.0.0 (major)
npm version patch

# 4. Publish to npm
npm publish

# 5. Verify on npm registry
npm info elliot-ai
```

### Package.json Configuration

Already configured in `elliot-cli/package.json`:
- ✅ `"name": "elliot-ai"`
- ✅ `"version": "1.0.0"`
- ✅ `"bin": { "elliot-ai": "./bin/elliot.js" }`
- ✅ `"type": "module"` (ES modules)

### npm Access Scopes

For private/scoped packages, update:
```json
{
  "name": "@elliot/ai"
}
```

Then publish with:
```bash
npm publish --access=public
```

## Verification

After publishing, verify installation:

```bash
# Install globally
npm install -g elliot-ai

# Test it works
elliot-ai --help
elliot-ai init

# Check npm registry
npm info elliot-ai
npm view elliot-ai versions
```

## Rollback

If you need to unpublish:

```bash
# Unpublish a specific version
npm unpublish elliot-ai@1.0.0

# Unpublish entire package (only within 72 hours of publish)
npm unpublish elliot-ai
```

## CI/CD Integration

To auto-publish on release:

1. Create GitHub Action: `.github/workflows/publish.yml`
2. Trigger on release: `on: [release]`
3. Run: `npm publish` with npm token from secrets

## Troubleshooting

**Package already published?**
```bash
npm publish --force
```

**Authentication failed?**
```bash
npm login
npm token list
npm token create --read-only
```

**Want to test locally first?**
```bash
npm pack
npm install -g ./elliot-ai-1.0.0.tgz
```

## Next Steps

1. Setup npm org for `@elliot/ai` scope (optional)
2. Configure GitHub Actions for auto-publish
3. Add CI checks before publish (tests, linting, builds)
4. Setup version bumping automation
