import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface InputBarProps {
  onSubmit: (query: string) => void;
  disabled: boolean;
}

export default function InputBar({ onSubmit, disabled }: InputBarProps) {
  const [input, setInput] = React.useState("");

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      onSubmit(value);
      setInput("");
    }
  };

  if (disabled) {
    return (
      <Box borderStyle="round" borderColor="gray" paddingX={1} marginTop={1}>
        <Text color="green">{">"} </Text>
        <Text color="gray">waiting...</Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="round" borderColor="gray" paddingX={1} marginTop={1}>
      <Text color="green">{">"} </Text>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder="ask about your codebase..."
      />
    </Box>
  );
}
