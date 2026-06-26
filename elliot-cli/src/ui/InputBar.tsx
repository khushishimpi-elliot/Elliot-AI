import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface InputBarProps {
  onSubmit: (query: string) => void;
  disabled: boolean;
  terminalWidth?: number;
}

const WAITING_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export default function InputBar({
  onSubmit,
  disabled,
  terminalWidth = 120,
}: InputBarProps) {
  const [input, setInput] = React.useState("");
  const [spinnerFrame, setSpinnerFrame] = React.useState(0);

  React.useEffect(() => {
    if (!disabled) return;

    const interval = setInterval(() => {
      setSpinnerFrame((prev) => (prev + 1) % WAITING_FRAMES.length);
    }, 80);

    return () => clearInterval(interval);
  }, [disabled]);

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      onSubmit(value);
      setInput("");
    }
  };

  if (disabled) {
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
      >
        <Text color="gray">{"> "}</Text>
        <Text color="gray">{WAITING_FRAMES[spinnerFrame]} waiting for response...</Text>
      </Box>
    );
  }

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
    >
      <Text color="#4FFFB0">{"> "}</Text>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder="ask anything about your codebase..."
      />
    </Box>
  );
}
