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
  const backendStatus = backendHealthy ? "✅" : "❌";

  return (
    <>
      <Text>
        <Text bold color="green">
          ELLIOT-AI
        </Text>
        <Text color="gray"> • {config.org_name}</Text>
      </Text>
      <Text color="gray">
        {config.stack} • Backend {backendStatus} offline • {chunkCountK}k chunks
      </Text>
    </>
  );
}
