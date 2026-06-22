import React from "react";
import { Box, Text } from "ink";

export interface Message {
  type: "query" | "response" | "thinking" | "error";
  content: string;
  sources?: Record<string, number>;
}

interface ConversationProps {
  messages: Message[];
}

const THINKING_FRAMES = ["▋", "▊", "▉"];

export default function Conversation({ messages }: ConversationProps) {
  const [thinkingFrame, setThinkingFrame] = React.useState(0);

  React.useEffect(() => {
    const hasThinking = messages.some((m) => m.type === "thinking");
    if (!hasThinking) return;

    const interval = setInterval(() => {
      setThinkingFrame((prev) => (prev + 1) % THINKING_FRAMES.length);
    }, 200);

    return () => clearInterval(interval);
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Box
        flexDirection="column"
        flexGrow={1}
        justifyContent="center"
        paddingX={2}
      >
        <Text color="gray">Ask anything about your codebase.</Text>
        <Text color="gray">Type a question below and press Enter.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
      {messages.map((msg, idx) => (
        <Box key={idx} flexDirection="column" marginBottom={1}>
          {msg.type === "query" && (
            <Text color="green">$ {msg.content}</Text>
          )}
          {msg.type === "thinking" && (
            <Text color="gray">
              {THINKING_FRAMES[thinkingFrame]} thinking...
            </Text>
          )}
          {msg.type === "response" && <Text>{msg.content}</Text>}
          {msg.type === "error" && <Text color="red">✗ {msg.content}</Text>}

          {msg.sources && (
            <Box marginTop={1}>
              <Text color="gray">
                Sources:{" "}
                {Object.entries(msg.sources)
                  .map(([key, count]) => `${key} (${count})`)
                  .join(" · ")}
              </Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}
