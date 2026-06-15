# CI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the GitHub Actions CI pipeline so every PR runs lint, pytest, vitest, and build across all three monorepo packages in parallel.

**Architecture:** Three parallel jobs (backend, terminal, dashboard) each scoped to their own working directory. Backend uses ruff + pytest. Both frontends use ESLint (via typescript-eslint) + vitest + Vite build. The existing `ci.yml` scaffold only runs build for the frontends — this plan adds the missing lint and test steps and adds a minimal ESLint config to each frontend.

**Tech Stack:** GitHub Actions, Python 3.11, ruff, pytest, Node 20, ESLint 9 (flat config), typescript-eslint, vitest, Vite

---

### Task 1: Create the feature branch

**Files:**
- No files changed — git only

- [ ] **Step 1: Make sure you're on main and up to date**

```bash
cd Elliot-AI
git checkout main
git pull
```

- [ ] **Step 2: Create the branch**

```bash
git checkout -b setup/03-ci-pipeline
```

Expected: `Switched to a new branch 'setup/03-ci-pipeline'`

---

### Task 2: Add typescript-eslint to terminal

ESLint 9 uses flat config by default. Without a TypeScript-aware parser, ESLint will throw parse errors on `.ts`/`.tsx` files. `typescript-eslint` provides both the parser and recommended rules.

**Files:**
- Modify: `terminal/package.json`
- Modify: `terminal/package-lock.json` (auto-updated by npm)

- [ ] **Step 1: Install typescript-eslint**

```bash
cd terminal
npm install --save-dev typescript-eslint
```

Expected: package-lock.json updated, `typescript-eslint` appears in `devDependencies` in package.json.

- [ ] **Step 2: Verify it appears in package.json devDependencies**

Open `terminal/package.json` and confirm you see:
```json
"typescript-eslint": "^8.x.x"
```
(exact version will vary)

---

### Task 3: Create eslint.config.js for terminal

**Files:**
- Create: `terminal/eslint.config.js`

- [ ] **Step 1: Create the config file**

Create `terminal/eslint.config.js` with this content:

```js
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
  },
);
```

- [ ] **Step 2: Run lint locally and confirm it passes**

```bash
# still inside terminal/
npm run lint
```

Expected: no output, exit code 0. If you see errors, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
cd ..
git add terminal/package.json terminal/package-lock.json terminal/eslint.config.js
git commit -m "feat(terminal): add eslint flat config with typescript-eslint"
```

---

### Task 4: Add typescript-eslint to dashboard

**Files:**
- Modify: `dashboard/package.json`
- Modify: `dashboard/package-lock.json` (auto-updated by npm)

- [ ] **Step 1: Install typescript-eslint**

```bash
cd dashboard
npm install --save-dev typescript-eslint
```

Expected: package-lock.json updated, `typescript-eslint` appears in devDependencies.

---

### Task 5: Create eslint.config.js for dashboard

**Files:**
- Create: `dashboard/eslint.config.js`

- [ ] **Step 1: Create the config file**

Create `dashboard/eslint.config.js` with this content:

```js
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
  },
);
```

- [ ] **Step 2: Run lint locally and confirm it passes**

```bash
# still inside dashboard/
npm run lint
```

Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
cd ..
git add dashboard/package.json dashboard/package-lock.json dashboard/eslint.config.js
git commit -m "feat(dashboard): add eslint flat config with typescript-eslint"
```

---

### Task 6: Update vitest test scripts to pass with no test files

By default, `vitest run` exits with code 1 if it finds no test files. The `--passWithNoTests` flag makes it exit 0 instead, keeping CI green until tests are added.

**Files:**
- Modify: `terminal/package.json`
- Modify: `dashboard/package.json`

- [ ] **Step 1: Update terminal/package.json test script**

In `terminal/package.json`, change:
```json
"test": "vitest run"
```
to:
```json
"test": "vitest run --passWithNoTests"
```

- [ ] **Step 2: Verify the test script passes locally**

```bash
cd terminal
npm run test
```

Expected: `No test files found, exiting with code 0` or similar. Exit code 0.

- [ ] **Step 3: Update dashboard/package.json test script**

In `dashboard/package.json`, change:
```json
"test": "vitest run"
```
to:
```json
"test": "vitest run --passWithNoTests"
```

- [ ] **Step 4: Verify the test script passes locally**

```bash
cd ../dashboard
npm run test
```

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
cd ..
git add terminal/package.json dashboard/package.json
git commit -m "feat: add --passWithNoTests to vitest scripts"
```

---

### Task 7: Update ci.yml — add lint and test to frontend jobs

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Open `.github/workflows/ci.yml`**

The current terminal job looks like this:

```yaml
terminal:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: terminal
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: npm
        cache-dependency-path: terminal/package-lock.json
    - run: npm ci || npm install
    - run: npm run build
```

Replace it with:

```yaml
terminal:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: terminal
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: npm
        cache-dependency-path: terminal/package-lock.json
    - run: npm ci
    - run: npm run lint
    - run: npm run test
    - run: npm run build
```

- [ ] **Step 2: Do the same for the dashboard job**

The current dashboard job looks like this:

```yaml
dashboard:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: dashboard
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: npm
        cache-dependency-path: dashboard/package-lock.json
    - run: npm ci || npm install
    - run: npm run build
```

Replace it with:

```yaml
dashboard:
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: dashboard
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: npm
        cache-dependency-path: dashboard/package-lock.json
    - run: npm ci
    - run: npm run lint
    - run: npm run test
    - run: npm run build
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint and vitest steps to terminal and dashboard jobs"
```

---

### Task 8: Push branch and open PR

**Files:**
- No files changed — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin setup/03-ci-pipeline
```

- [ ] **Step 2: Open a PR on GitHub**

Go to `https://github.com/khushishimpi-elliot/Elliot-AI` — GitHub will show a banner to open a PR from your branch.

PR title: `03. GitHub Actions CI pipeline`

PR body:
```
Completes the CI pipeline scaffold.

Changes:
- Add `typescript-eslint` + `eslint.config.js` to terminal and dashboard
- Add `npm run lint` and `npm run test` (vitest --passWithNoTests) steps to both frontend CI jobs
- Fix `npm ci || npm install` → `npm ci` in both frontend jobs

ClickUp: https://app.clickup.com/t/86d3b0e99
```

- [ ] **Step 3: Wait for CI to go green**

On the PR page, watch the "Checks" section. All three jobs (backend, terminal, dashboard) should pass.

If any job fails, click it to read the logs and fix the issue before merging.

- [ ] **Step 4: Update ClickUp task status to "complete" after merge**

Go to https://app.clickup.com/t/86d3b0e99 and move the task from `in progress` → `complete`.
