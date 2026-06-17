import { useState, useRef, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import RightPanel from "./components/RightPanel";

interface TranscriptLine {
  type: "user" | "response";
  text: string;
}

interface ResponseContext {
  files?: string[];
  jira?: string;
  pr?: string;
  adr?: string;
  chunks?: number;
}

export default function App() {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { type: "response", text: "Welcome to Elliot-AI. Type a question to get started." },
  ]);
  const [loading, setLoading] = useState(false);
  const [responseFiles, setResponseFiles] = useState<string[]>([]);
  const [responseContext, setResponseContext] = useState<ResponseContext>({});
  const [query, setQuery] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setQuery("");
    setTranscript((t) => [...t, { type: "user", text: `$ elliot ask "${userQuery}"` }]);
    setLoading(true);
    setResponseFiles([]);
    setResponseContext({});

    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      setTranscript((t) => [
        ...t,
        {
          type: "response",
          text: "[offline] Backend not connected. Set VITE_API_URL in .env.local",
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/query/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userQuery,
          tenant_id: "00000000-0000-0000-0000-000000000001",
          user_id: "00000000-0000-0000-0000-000000000002",
          team_id: "00000000-0000-0000-0000-000000000003",
        }),
      });

      if (!response.ok) {
        setTranscript((t) => [
          ...t,
          {
            type: "response",
            text: `[error] Backend returned ${response.status}`,
          },
        ]);
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setTranscript((t) => [
          ...t,
          {
            type: "response",
            text: "[error] Could not read response stream",
          },
        ]);
        setLoading(false);
        return;
      }

      let isFirstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        if (isFirstChunk) {
          setTranscript((t) => [...t, { type: "response", text: chunk }]);
          isFirstChunk = false;
        } else {
          setTranscript((t) => {
            const last = t[t.length - 1];
            if (last?.type === "response") {
              return [
                ...t.slice(0, -1),
                { ...last, text: last.text + chunk },
              ];
            }
            return t;
          });
        }
      }

      setResponseContext({
        chunks: 542000,
      });
    } catch (error) {
      setTranscript((t) => [
        ...t,
        {
          type: "response",
          text: `[error] ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="top-bar-brand">ELLIOT-AI</div>
        <div className="top-bar-status">
          <span className="top-bar-status-dot">●</span>
          elliot-ai.cloud · tenant provisioning
        </div>
      </div>

      <div className="main-container">
        <div className="terminal">
          <Sidebar />

          <div className="main-content">
            <div className="output" ref={outputRef}>
              {transcript.map((line, i) => (
                <div
                  key={i}
                  className={`line ${line.type === "user" ? "line-user" : "line-response"}`}
                >
                  {line.text}
                </div>
              ))}
              {loading && (
                <div className="line line-response">
                  ▋ thinking...
                </div>
              )}
            </div>
            <form className="input-bar" onSubmit={handleSubmit}>
              <span className="prompt">$</span>
              <input
                autoFocus
                value={query}
                disabled={loading}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ask anything about your codebase..."
              />
            </form>
          </div>

          <RightPanel files={responseFiles} context={responseContext} />
        </div>
      </div>
    </div>
  );
}
