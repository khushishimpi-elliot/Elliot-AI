import React from "react";
import { Box } from "ink";
import { ElliotConfig } from "../config.js";
import { ConnectorInfo } from "../api.js";
import { streamQuery } from "../stream.js";
import Header from "./Header.js";
import Conversation, { Message } from "./Conversation.js";
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
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (query: string) => {
    setMessages((prev) => [...prev, { type: "query", content: query }]);
    setMessages((prev) => [...prev, { type: "thinking", content: "" }]);
    setIsLoading(true);

    let response = "";
    let sources: Record<string, number> = {};

    try {
      await streamQuery(
        query,
        config,
        (token) => {
          response += token;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.type === "response" || lastMsg.type === "thinking") {
              if (lastMsg.type === "thinking") {
                newMessages[newMessages.length - 1] = {
                  type: "response",
                  content: token,
                };
              } else {
                lastMsg.content += token;
              }
            }
            return newMessages;
          });
        },
        (sourcesData) => {
          sources = sourcesData;
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.type === "response") {
              lastMsg.sources = sources;
            }
            return newMessages;
          });
        },
        (error) => {
          setMessages((prev) =>
            prev.filter((m) => m.type !== "thinking").concat({
              type: "error",
              content: error,
            })
          );
        }
      );
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.type !== "thinking").concat({
          type: "error",
          content: "Failed to get response",
        })
      );
    }

    setIsLoading(false);
  };

  return (
    <Box flexDirection="column" height="100%">
      <Header
        config={config}
        connectors={connectors}
        chunkCount={chunkCount}
        backendHealthy={backendHealthy}
      />
      <Conversation messages={messages} />
      <InputBar onSubmit={handleSubmit} disabled={isLoading} />
    </Box>
  );
}
