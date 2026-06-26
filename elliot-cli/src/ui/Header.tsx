import React from "react";
import { Box, Text } from "ink";
import { ElliotConfig } from "../config.js";
import { ConnectorInfo } from "../api.js";

interface HeaderProps {
  config: ElliotConfig;
  connectors: ConnectorInfo[];
  chunkCount: number;
  backendHealthy: boolean;
  terminalWidth?: number;
}

export default function Header({
  config,
  connectors,
  chunkCount,
  backendHealthy,
  terminalWidth = 120,
}: HeaderProps) {
  const chunkCountK = Math.round(chunkCount / 1000);

  const connectorStatus = connectors
    .map((c) => `${c.provider} ${c.status === "connected" ? "✓" : "✗"}`)
    .join("  ");

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      borderBottom={false}
      borderTop={true}
      borderLeft={true}
      borderRight={true}
      paddingX={1}
      paddingY={0}
      width={terminalWidth}
      marginBottom={0}
    >
      {/* Line 1: ELLIOT-AI | domain */}
      <Box justifyContent="space-between" width={terminalWidth - 2}>
        <Text bold color="#4FFFB0">
          ELLIOT-AI
        </Text>
        <Text color="gray">elliot-ai.cloud</Text>
      </Box>

      {/* Line 2: org · stack · arch */}
      <Text color="white">
        {config.org_name} · {config.stack} · Hexagonal arch
      </Text>

      {/* Line 3: Connectors · chunks */}
      <Text color="gray">
        {connectorStatus}  ·  {chunkCountK}k chunks
      </Text>
    </Box>
  );
}
