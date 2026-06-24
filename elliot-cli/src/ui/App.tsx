import React from "react";
import { Box, useInput, useApp, useStdout } from "ink";
import { ElliotConfig } from "../config.js";
import { ConnectorInfo } from "../api.js";
import { streamQuery } from "../stream.js";
import Header from "./Header.js";
import Sidebar, { Session } from "./Sidebar.js";
import Conversation, { Message } from "./Conversation.js";
import Footer from "./Footer.js";
import InputBar from "./InputBar.js";

interface AppProps {
  config: ElliotConfig;
  connectors: ConnectorInfo[];
  chunkCount: number;
  backendHealthy: boolean;
}

export default function App({
  config,
  connectors,
  chunkCount,
  backendHealthy,
}: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 120;
  const sidebarWidth = 22;

  const [sessions, setSessions] = React.useState<Session[]>([
    { id: "1", title: "New session", messageCount: 0 },
  ]);
  const [activeSessionId, setActiveSessionId] = React.useState("1");
  const [isLoading, setIsLoading] = React.useState(false);
  const [allMessages, setAllMessages] = React.useState<
    Record<string, Message[]>
  >({ "1": [] });

  const currentMessages = allMessages[activeSessionId] || [];

  // Keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
    if (key.ctrl && input === "n") {
      const newId = String(Date.now());
      setSessions((prev) => [
        ...prev,
        { id: newId, title: "New session", messageCount: 0 },
      ]);
      setActiveSessionId(newId);
      setAllMessages((prev) => ({ ...prev, [newId]: [] }));
    }
  });

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const queryMsg: Message = { type: "query", content: query };
    const thinkingMsg: Message = { type: "thinking", content: "" };

    setAllMessages((prev) => ({
      ...prev,
      [activeSessionId]: [...prev[activeSessionId], queryMsg, thinkingMsg],
    }));

    // Update session title if first message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId && s.title === "New session"
          ? { ...s, title: query.slice(0, 30), messageCount: 2 }
          : s.id === activeSessionId
            ? { ...s, messageCount: s.messageCount + 2 }
            : s
      )
    );

    setIsLoading(true);
    let responseContent = "";
    let sourcesData: Record<string, number> = {};

    try {
      await streamQuery(
        query,
        config,
        (token) => {
          responseContent += token;
          setAllMessages((prev) => {
            const msgs = [...prev[activeSessionId]];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.type === "thinking") {
              msgs[msgs.length - 1] = {
                type: "response",
                content: token,
              };
            } else if (lastMsg.type === "response") {
              lastMsg.content += token;
            }
            return { ...prev, [activeSessionId]: msgs };
          });
        },
        (sources) => {
          sourcesData = sources;
          setAllMessages((prev) => {
            const msgs = [...prev[activeSessionId]];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.type === "response") {
              lastMsg.sources = sources;
            }
            return { ...prev, [activeSessionId]: msgs };
          });
          setIsLoading(false);
        },
        (error) => {
          setAllMessages((prev) => {
            const msgs = prev[activeSessionId].filter(
              (m) => m.type !== "thinking"
            );
            return {
              ...prev,
              [activeSessionId]: [
                ...msgs,
                { type: "error", content: error },
              ],
            };
          });
          setIsLoading(false);
        }
      );
    } catch (err) {
      setAllMessages((prev) => {
        const msgs = prev[activeSessionId].filter((m) => m.type !== "thinking");
        return {
          ...prev,
          [activeSessionId]: [
            ...msgs,
            {
              type: "error",
              content: "Failed to get response",
            },
          ],
        };
      });
      setIsLoading(false);
    }
  };

  const conversationWidth = terminalWidth - sidebarWidth - 3;

  return (
    <Box flexDirection="column" height="100%">
      {/* HEADER */}
      <Header
        config={config}
        connectors={connectors}
        chunkCount={chunkCount}
        backendHealthy={backendHealthy}
        terminalWidth={terminalWidth}
      />

      {/* MAIN CONTENT: SIDEBAR + CONVERSATION */}
      <Box flexDirection="row" flexGrow={1}>
        {/* SIDEBAR */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          width={sidebarWidth}
        />

        {/* VERTICAL DIVIDER */}
        <Box
          borderStyle="single"
          borderLeft={true}
          borderRight={false}
          borderTop={false}
          borderBottom={false}
        />

        {/* CONVERSATION */}
        <Conversation
          messages={currentMessages}
          width={conversationWidth}
        />
      </Box>

      {/* FOOTER */}
      <Footer
        connectors={connectors}
        backendHealthy={backendHealthy}
        terminalWidth={terminalWidth}
      />

      {/* INPUT BAR */}
      <InputBar
        onSubmit={handleSubmit}
        disabled={isLoading}
        terminalWidth={terminalWidth}
      />
    </Box>
  );
}
