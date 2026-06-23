import { Box, Text } from "ink";
import React from "react";

import { theme } from "../theme.js";

interface Props {
  org?: string;
  email?: string;
  apiUrl: string;
  reachable: boolean;
}

export function Header({ org, email, apiUrl, reachable }: Props) {
  return (
    <Box
      borderStyle="single"
      borderColor={theme.muted}
      paddingX={1}
      justifyContent="space-between"
    >
      <Box>
        <Text color={theme.accent} bold>
          $ elliot
        </Text>
        <Text color="gray">  ·  </Text>
        <Text>{org ?? "no workspace"}</Text>
        {email && (
          <>
            <Text color="gray">  ·  </Text>
            <Text color={theme.blue}>{email}</Text>
          </>
        )}
      </Box>
      <Box>
        <Text color={reachable ? "green" : "red"}>●</Text>
        <Text color="gray"> {new URL(apiUrl).host}</Text>
      </Box>
    </Box>
  );
}
