import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import React from "react";

import { theme } from "../theme.js";

export interface Turn {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  meta?: string;
  pending?: boolean;
}

interface Props {
  turns: Turn[];
}

export function Conversation({ turns }: Props) {
  return (
    <Box flexDirection="column" paddingY={1} flexGrow={1}>
      {turns.map((t) => (
        <Box key={t.id} flexDirection="column" marginBottom={1}>
          {t.role === "user" && (
            <Text color={theme.prompt}>
              {"> "}
              <Text color="white">{t.content}</Text>
            </Text>
          )}
          {t.role === "assistant" && (
            <Box flexDirection="column">
              {t.pending ? (
                <Text color={theme.accent}>
                  <Spinner type="dots" /> <Text color="gray">thinking…</Text>
                </Text>
              ) : (
                <Text>{t.content}</Text>
              )}
              {t.meta && !t.pending && (
                <Text color="gray">{`[${t.meta}]`}</Text>
              )}
            </Box>
          )}
          {t.role === "system" && (
            <Text color="gray" italic>
              {t.content}
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
}
