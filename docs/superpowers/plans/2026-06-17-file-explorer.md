# File Explorer Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an expandable file tree panel to the terminal sidebar that uses stub data and inserts the clicked file path into the query input.

**Architecture:** A new `FileExplorer` React component renders a hardcoded stub tree. It receives `onFileSelect` as a prop. App.tsx wires it below the onboarding checklist and passes a handler that calls `setQuery("ask about <path>")`. Styles use the existing CSS variables — no new dependencies.

**Tech Stack:** React, TypeScript, Vite, plain CSS

---

### Task 1: Create feature branch

**Files:** None — git only

- [ ] **Step 1: Checkout main and pull**

```bash
cd Elliot-AI
git checkout main
git pull
```

- [ ] **Step 2: Create branch**

```bash
git checkout -b terminal-ui/37-file-explorer
```

Expected: `Switched to a new branch 'terminal-ui/37-file-explorer'`

---

### Task 2: Create FileExplorer component + CSS + wire into App

**Files:**
- Create: `terminal/src/components/FileExplorer.tsx`
- Modify: `terminal/src/App.css`
- Modify: `terminal/src/App.tsx`

- [ ] **Step 1: Create `terminal/src/components/FileExplorer.tsx`**

```tsx
import { useState } from "react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

const STUB_TREE: FileNode[] = [
  {
    name: "src",
    path: "src",
    type: "folder",
    children: [
      { name: "App.tsx", path: "src/App.tsx", type: "file" },
      { name: "main.tsx", path: "src/main.tsx", type: "file" },
    ],
  },
  {
    name: "backend",
    path: "backend",
    type: "folder",
    children: [
      { name: "main.py", path: "backend/main.py", type: "file" },
      { name: "auth/router.py", path: "backend/auth/router.py", type: "file" },
    ],
  },
  {
    name: "terminal",
    path: "terminal",
    type: "folder",
    children: [
      { name: "vite.config.ts", path: "terminal/vite.config.ts", type: "file" },
    ],
  },
];

interface TreeNodeProps {
  node: FileNode;
  onFileSelect: (path: string) => void;
}

function TreeNode({ node, onFileSelect }: TreeNodeProps) {
  const [open, setOpen] = useState(false);

  if (node.type === "folder") {
    return (
      <div>
        <div
          className="tree-folder tree-item"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="tree-toggle">{open ? "▼" : "▶"}</span>
          {node.name}
        </div>
        {open &&
          node.children?.map((child) => (
            <TreeNode key={child.path} node={child} onFileSelect={onFileSelect} />
          ))}
      </div>
    );
  }

  return (
    <div
      className="tree-file tree-item"
      onClick={() => onFileSelect(node.path)}
    >
      – {node.name}
    </div>
  );
}

interface FileExplorerProps {
  onFileSelect: (path: string) => void;
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  return (
    <div className="file-explorer">
      <div className="file-explorer-title">FILES</div>
      {STUB_TREE.map((node) => (
        <TreeNode key={node.path} node={node} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add file explorer styles to `terminal/src/App.css`**

Append to the end of `terminal/src/App.css`:

```css
.file-explorer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.file-explorer-title {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.tree-item {
  padding: 3px 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--fg);
  user-select: none;
}

.tree-folder {
  color: var(--fg);
}

.tree-toggle {
  color: var(--muted);
  margin-right: 6px;
  font-size: 10px;
}

.tree-file {
  padding-left: 20px;
  color: var(--muted);
}

.tree-file:hover {
  color: var(--accent);
}
```

- [ ] **Step 3: Update `terminal/src/App.tsx` to import and use FileExplorer**

Replace the full content of `terminal/src/App.tsx` with:

```tsx
import { useState } from "react";
import FileExplorer from "./components/FileExplorer";

const STEPS = ["Sign in", "Workspace", "SDLC", "Sources", "Index", "Launch"];

export default function App() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([
    "$ elliot",
    "Welcome to Elliot-AI. Type a question to get started.",
  ]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setHistory((h) => [
      ...h,
      `$ elliot ask "${query}"`,
      "[stub] backend not wired yet",
    ]);
    setQuery("");
  }

  function handleFileSelect(path: string) {
    setQuery(`ask about ${path}`);
  }

  return (
    <div className="terminal">
      <aside className="sidebar">
        <div className="brand">$ elliot</div>
        <ul>
          {STEPS.map((s) => (
            <li key={s}>
              <span className="check">[ ]</span> {s}
            </li>
          ))}
        </ul>
        <FileExplorer onFileSelect={handleFileSelect} />
      </aside>
      <main className="main">
        <div className="output">
          {history.map((line, i) => (
            <div key={i} className="line">
              {line}
            </div>
          ))}
        </div>
        <form className="input-bar" onSubmit={submit}>
          <span className="prompt">$</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ask anything..."
          />
        </form>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Run lint + build to verify**

```bash
cd terminal
npm run lint
npm run build
```

Expected: no lint errors, build succeeds with output sizes printed.

- [ ] **Step 5: Commit**

```bash
cd ..
git add terminal/src/components/FileExplorer.tsx terminal/src/App.css terminal/src/App.tsx
git commit -m "feat(terminal-ui): add FileExplorer panel with expandable tree"
```

---

### Task 3: Push branch and open PR

**Files:** None — git only

- [ ] **Step 1: Push the branch**

```bash
git push -u origin terminal-ui/37-file-explorer
```

- [ ] **Step 2: Open PR on GitHub**

Title: `37. File explorer panel`

Body:
```
Adds expandable file tree panel to the terminal sidebar.

Changes:
- `terminal/src/components/FileExplorer.tsx` — expandable tree component with stub data
- `terminal/src/App.css` — file explorer styles using existing CSS variables
- `terminal/src/App.tsx` — wire FileExplorer below checklist, clicking a file sets query

Clicking a file inserts "ask about <path>" into the query input.
Folders start collapsed; click to expand/collapse.
Stub data — backend wiring is a separate task.

ClickUp: https://app.clickup.com/t/86d3b0eeu
```

- [ ] **Step 3: Wait for CI to go green, then merge**

- [ ] **Step 4: Update ClickUp task 37 to "complete"**

Go to `https://app.clickup.com/t/86d3b0eeu` and set status to complete.
