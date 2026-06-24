import React from "react";
import { Box, Text } from "ink";
import { ConnectorInfo } from "../api.js";
import os from "os";

interface FooterProps {
  connectors: ConnectorInfo[];
  backendHealthy: boolean;
  terminalWidth?: number;
}

export default function Footer({
  connectors,
  backendHealthy,
  terminalWidth = 120,
}: FooterProps) {
  const homeDir = os.homedir();
  const currentDir = process.cwd();
  const displayDir =
    currentDir === homeDir
      ? "~"
      : currentDir.startsWith(homeDir)
        ? "~" + currentDir.slice(homeDir.length)
        : currentDir;

  const connectedCount = connectors.filter(
    (c) => c.status === "connected"
  ).length;
  const toolsStatus =
    backendHealthy && connectedCount > 0
      ? `✓  ${connectedCount} tools`
      : "✗  offline";
  const statusColor = backendHealthy ? "gray" : "#FF6B6B";

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      borderTop={true}
      borderBottom={true}
      borderLeft={true}
      borderRight={true}
      paddingX={1}
      paddingY={0}
      width={terminalWidth}
      justifyContent="space-between"
    >
      <Text color="gray">{displayDir}</Text>
      <Text color={statusColor}>MCP {toolsStatus}</Text>
    </Box>
  );
}
