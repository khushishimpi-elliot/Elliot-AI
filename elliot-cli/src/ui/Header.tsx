import React from "react";
import { Box, Text } from "ink";
import { ElliotConfig } from "../config.js";
import { ConnectorInfo } from "../api.js";

interface HeaderProps {
  config: ElliotConfig;
  connectors: ConnectorInfo[];
  chunkCount: number;
  backendHealthy: boolean;
}

export default function Header({
  config,
  connectors,
  chunkCount,
  backendHealthy,
}: HeaderProps) {
  const chunkCountK = Math.round(chunkCount / 1000);

  const connectorStatus = connectors
    .map((c) => {
      const icon = c.status === "connected" ? "✅" : "❌";
      return `${c.provider} ${icon}`;
    })
    .join("  ");

  const backendStatus = backendHealthy ? "✅ online" : "❌ offline";

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      paddingX={1}
      paddingY={0}
      marginBottom={1}
    >
      <Box>
        <Text bold color="green">
          ELLIOT-AI
        </Text>
        <Text color="gray"> • {config.org_name}</Text>
      </Box>

      <Box>
        <Text color="gray">
          {config.stack} · {config.stack} · Backend {backendStatus}
        </Text>
      </Box>

      {connectors.length > 0 && (
        <Box>
          <Text color="gray">{connectorStatus}</Text>
        </Box>
      )}

      <Box>
        <Text color="gray">{chunkCountK}k chunks indexed</Text>
      </Box>
    </Box>
  );
}
