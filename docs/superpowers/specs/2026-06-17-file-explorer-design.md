# File Explorer Panel Design — Task 37

## Overview

An expandable file tree panel added to the terminal UI sidebar, below the onboarding checklist. Uses static stub data for v1. Clicking a file inserts its path into the query input.

## Files

| File | Action |
|------|--------|
| `terminal/src/components/FileExplorer.tsx` | Create — file tree component |
| `terminal/src/App.tsx` | Modify — add FileExplorer below checklist, wire onFileSelect |
| `terminal/src/App.css` | Modify — add file explorer styles |

## FileExplorer component

**Props:** `onFileSelect: (path: string) => void`

**Stub data (hardcoded):**
```
src/
  App.tsx
  main.tsx
backend/
  main.py
  auth/router.py
terminal/
  vite.config.ts
```

**Behavior:**
- Folders show ▶ when collapsed, ▼ when expanded — clicking toggles
- Files are indented under their folder when expanded
- Clicking a file calls `onFileSelect(path)`
- All folders start collapsed by default

## Integration (App.tsx)

- Import `FileExplorer` and render it below the `<ul>` checklist in the sidebar
- `onFileSelect` handler: `setQuery("ask about " + path)`
- Query state is already lifted to App — no new state needed

## CSS (App.css additions)

```css
.file-explorer          /* container with top border separator */
.file-explorer-title    /* small "FILES" label in --muted color */
.tree-item              /* each folder/file row */
.tree-folder            /* clickable folder row with toggle icon */
.tree-file              /* clickable file row, indented */
.tree-file:hover        /* highlight on hover */
```

All colors use existing CSS variables (--muted, --fg, --accent, --border). No new dependencies.
