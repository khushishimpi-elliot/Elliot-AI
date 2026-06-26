import React from "react";
import { Box, Text } from "ink";

export interface Message {
  type: "query" | "response" | "thinking" | "error";
  content: string;
  sources?: Record<string, number>;
}

interface ConversationProps {
  messages: Message[];
  width?: number;
}

const THINKING_FRAMES = ["▋", "▊", "▉"];

export default function Conversation({ messages, width = 95 }: ConversationProps) {
  const [thinkingFrame, setThinkingFrame] = React.useState(0);

  React.useEffect(() => {
    const hasThinking = messages.some((m) => m.type === "thinking");
    if (!hasThinking) return;

    const interval = setInterval(() => {
      setThinkingFrame((prev) => (prev + 1) % THINKING_FRAMES.length);
    }, 200);

    return () => clearInterval(interval);
  }, [messages]);

  const renderEmptyState = () => (
    <Box flexDirection="column" justifyContent="center" flexGrow={1} paddingX={2}>
      <Text color="gray">Ask anything about your codebase.</Text>
      <Box marginTop={2} flexDirection="column">
        <Text color="gray" bold>
          Examples:
        </Text>
        <Text color="gray">  how does authentication work?</Text>
        <Text color="gray">  explain PR #452</Text>
        <Text color="gray">  status of ticket PAY-234?</Text>
      </Box>
      <Box marginTop={2}>
        <Text color="gray">ctrl+c to exit · ctrl+n for new session</Text>
      </Box>
    </Box>
  );

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1} width={width}>
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        messages.map((msg, idx) => (
          <Box key={idx} flexDirection="column" marginBottom={1}>
            {msg.type === "query" && (
              <Text color="#4FFFB0">$ {msg.content}</Text>
            )}
            {msg.type === "thinking" && (
              <Text color="gray">
                {THINKING_FRAMES[thinkingFrame]} thinking...
              </Text>
            )}
            {msg.type === "response" && <Text>{msg.content}</Text>}
            {msg.type === "error" && (
              <Text color="#FF6B6B">✗ {msg.content}</Text>
            )}

            {msg.sources && (
              <Box marginTop={1}>
                <Text color="gray">
                  {"─".repeat(Math.min(30, width - 4))}
                </Text>
              </Box>
            )}
            {msg.sources && (
              <Box marginTop={0}>
                <Text color="gray">
                  {Object.entries(msg.sources)
                    .map(([key, count]) => `${key}(${count})`)
                    .join(" · ")}
                </Text>
              </Box>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}
