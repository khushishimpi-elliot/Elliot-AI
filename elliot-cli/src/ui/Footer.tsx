import React from "react";
import { Box, Text } from "ink";
import { ConnectorInfo } from "../api.js";
import os from "os";
import path from "path";

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
  const borderLine = "─".repeat(terminalWidth - 2);
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
  const statusColor = backendHealthy ? "gray" : "red";

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      paddingX={1}
      width={terminalWidth - 2}
    >
      {/* Top Border */}
      <Text color="gray">{borderLine}</Text>

      {/* Status Bar */}
      <Box justifyContent="space-between" width={terminalWidth - 2}>
        <Text color="gray">{displayDir}</Text>
        <Text color={statusColor}>MCP {toolsStatus}</Text>
      </Box>
    </Box>
  );
}
