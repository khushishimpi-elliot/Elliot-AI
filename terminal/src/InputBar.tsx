import React, { useEffect, useRef, useState } from "react";

interface Props {
  history: string[];
  onSubmit: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Terminal-style input bar with up/down arrow history navigation.
 *
 * Behaviour matches bash / readline:
 *  - `Up`   moves to the previous command (older).
 *  - `Down` moves to the next command (newer). At the bottom, restores the
 *           in-progress draft the user was typing before they started
 *           navigating.
 *  - `Enter` submits. The submitted text is added to history by the parent
 *           and the input is cleared.
 *  - `Esc`  cancels history navigation and restores the draft.
 */
export default function InputBar({
  history,
  onSubmit,
  placeholder = "ask anything...",
  autoFocus = true,
}: Props) {
  const [value, setValue] = useState("");
  // -1 means "not navigating; showing draft". 0..n-1 indexes from the end.
  const [historyOffset, setHistoryOffset] = useState(-1);
  // The draft is the in-progress text the user was typing before they
  // pressed Up. Restored when they navigate back past the newest entry.
  const draftRef = useRef("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
    setHistoryOffset(-1);
    draftRef.current = "";
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      if (history.length === 0) return;
      e.preventDefault();

      if (historyOffset === -1) draftRef.current = value;

      const next = Math.min(historyOffset + 1, history.length - 1);
      setHistoryOffset(next);
      setValue(history[history.length - 1 - next]);
      return;
    }

    if (e.key === "ArrowDown") {
      if (historyOffset === -1) return;
      e.preventDefault();

      const next = historyOffset - 1;
      setHistoryOffset(next);
      setValue(next === -1 ? draftRef.current : history[history.length - 1 - next]);
      return;
    }

    if (e.key === "Escape" && historyOffset !== -1) {
      e.preventDefault();
      setHistoryOffset(-1);
      setValue(draftRef.current);
    }
  }

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <span className="prompt">$</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (historyOffset !== -1) {
            // user started editing a recalled entry; treat it as the new draft
            setHistoryOffset(-1);
            draftRef.current = e.target.value;
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="terminal input"
      />
    </form>
  );
}
