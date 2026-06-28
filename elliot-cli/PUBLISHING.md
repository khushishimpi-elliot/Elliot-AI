# Publishing elliot-ai to npm

This guide explains how to publish the CLI to the npm registry.

## Prerequisites

- npm account with publish access
- Logged in locally: `npm login`

## Before Publishing

1. **Verify the version** in `package.json` matches your release
   ```json
   "version": "1.0.0"
   ```

2. **Build successfully**
   ```bash
   npm run build
   ```

3. **Test the package locally**
   ```bash
   npm link
   elliot-ai --version
   npm unlink -g elliot-ai  # Clean up after testing
   ```

## Publishing Steps

### 1. Bump the version

Update `package.json` with semantic versioning:
- Patch (bug fix): `1.0.1`
- Minor (new feature): `1.1.0`
- Major (breaking change): `2.0.0`

```bash
npm version patch  # or minor/major
```

This automatically:
- Updates package.json version
- Creates a git tag
- Commits the change

### 2. Publish to npm

```bash
npm publish
```

This will:
- Run `prepublishOnly` script (builds the code)
- Create the tarball with files specified in `package.json` `files` array
- Upload to npm registry
- Make it available at `https://www.npmjs.com/package/elliot-ai`

### 3. Verify publication

```bash
npm info elliot-ai
```

Or visit: https://www.npmjs.com/package/elliot-ai

## What Gets Published

The `files` array in `package.json` controls what's included:
```json
"files": [
  "dist",      // Compiled JavaScript
  "bin",       // Executable shebang
  "README.md"  // Documentation
]
```

The `.npmignore` file excludes:
- Source TypeScript
- Node modules
- Test files
- Git files

## Installing from npm

After publishing, users can install with:

```bash
npm install -g elliot-ai
elliot-ai setup --token JWT --tenant-id TENANT_ID
```

## Rollback (if needed)

If you need to unpublish a version:

```bash
npm unpublish elliot-ai@VERSION --force
```

⚠️ Can only unpublish versions published in the last 72 hours.

## CI/CD Integration

For automated publishing:
1. Create `.github/workflows/publish.yml`
2. Trigger on GitHub releases
3. Run `npm publish` on successful build

Example workflow:
```yaml
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### "You do not have permission to publish"
- You're not logged in: `npm login`
- You don't have publish access to the package
- The email in npm login doesn't match your npm account

### "Tag already exists"
- Use a different version number
- `npm version` manages this automatically

### Build fails before publish
- Fix the TypeScript errors
- Run `npm run build` to test locally
- Commit the fix before publishing
