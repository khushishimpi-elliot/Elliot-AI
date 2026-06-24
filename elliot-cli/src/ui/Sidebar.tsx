import React from "react";
import { Box, Text } from "ink";

export interface Session {
  id: string;
  title: string;
  messageCount: number;
}

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  width?: number;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  width = 22,
}: SidebarProps) {
  const visibleSessions = sessions.slice(0, 8);
  const truncateTitle = (title: string) => {
    return title.length > width - 3 ? title.slice(0, width - 4) + "…" : title;
  };

  return (
    <Box flexDirection="column" width={width} paddingLeft={1} paddingRight={1}>
      {/* Sessions Header */}
      <Text color="gray" bold>
        Sessions
      </Text>

      {/* Divider */}
      <Text color="gray">──────────</Text>

      {/* Session List */}
      <Box flexDirection="column" marginBottom={1}>
        {visibleSessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const prefix = isActive ? ">" : " ";
          const color = isActive ? "#4FFFB0" : "gray";
          const title = truncateTitle(session.title);

          return (
            <Box key={session.id} width={width - 2}>
              <Text color={color}>
                {prefix} {title}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Text color="gray">──────────</Text>
      <Text color="gray">? for help</Text>
      <Text color="gray">ctrl+n new</Text>
    </Box>
  );
}
