import { useState } from "react";

import InputBar from "./InputBar";

const STEPS = ["Sign in", "Workspace", "SDLC", "Sources", "Index", "Launch"];

/** The post-launch main terminal view. */
export default function Terminal() {
  const [transcript, setTranscript] = useState<string[]>([
    "$ elliot",
    "Welcome to Elliot-AI. Type a question to get started.",
  ]);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  function handleSubmit(query: string) {
    setTranscript((t) => [...t, `$ elliot ask "${query}"`, "[stub] backend not wired yet"]);
    setQueryHistory((h) => [...h, query]);
  }

  return (
    <div className="terminal">
      <aside className="sidebar">
        <div className="brand">$ elliot</div>
        <ul>
          {STEPS.map((s) => (
            <li key={s}>
              <span className="check">[x]</span> {s}
            </li>
          ))}
        </ul>
      </aside>
      <main className="main">
        <div className="output">
          {transcript.map((line, i) => (
            <div key={i} className="line">
              {line}
            </div>
          ))}
        </div>
        <InputBar history={queryHistory} onSubmit={handleSubmit} />
      </main>
    </div>
  );
}
