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
