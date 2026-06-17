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
