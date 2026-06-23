import { Box, render, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import React, { useEffect, useState } from "react";

import { ping } from "../api/client.js";
import { ask } from "../api/query.js";
import { getLaunchSummary } from "../api/launch.js";
import { isAuthenticated, loadConfig } from "../config/store.js";
import { Conversation, Turn } from "../ui/components/Conversation.js";
import { Header } from "../ui/components/Header.js";
import { theme } from "../ui/theme.js";

/**
 * Interactive Elliot REPL.
 *
 *   ↵        send query
 *   /clear   wipe transcript
 *   /help    list commands
 *   /quit    exit (also Ctrl-C / Ctrl-D)
 */
function Repl() {
  const { exit } = useApp();
  const cfg = loadConfig();

  const [reachable, setReachable] = useState(false);
  const [org, setOrg] = useState<string | undefined>(cfg.orgName);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([
    {
      id: 0,
      role: "system",
      content: "Welcome to Elliot. Type a question, or /help for commands.",
    },
  ]);
  const [history, setHistory] = useState<string[]>([]);
  const [histOffset, setHistOffset] = useState(-1);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const idRef = React.useRef(1);

  // ── one-time: probe backend + refresh org name
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await ping();
      if (cancelled) return;
      setReachable(ok);
      if (ok && isAuthenticated()) {
        try {
          const s = await getLaunchSummary();
          if (!cancelled) setOrg(s.org_name);
        } catch {
          /* token may be expired; non-fatal */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── key handling: Up/Down history, Ctrl-D / Ctrl-C exit
  useInput((char, key) => {
    if (pending) return;
    if (key.upArrow) {
      if (history.length === 0) return;
      if (histOffset === -1) setDraft(input);
      const next = Math.min(histOffset + 1, history.length - 1);
      setHistOffset(next);
      setInput(history[history.length - 1 - next]);
    } else if (key.downArrow) {
      if (histOffset === -1) return;
      const next = histOffset - 1;
      setHistOffset(next);
      setInput(next === -1 ? draft : history[history.length - 1 - next]);
    } else if (key.ctrl && (char === "c" || char === "d")) {
      exit();
    }
  });

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setHistOffset(-1);
    setDraft("");
    setHistory((h) => [...h, trimmed]);

    // slash commands
    if (trimmed === "/quit" || trimmed === "/exit") {
      exit();
      return;
    }
    if (trimmed === "/clear") {
      setTurns([]);
      return;
    }
    if (trimmed === "/help") {
      setTurns((t) => [
        ...t,
        {
          id: idRef.current++,
          role: "system",
          content: "Commands:  /help · /clear · /quit (or Ctrl-D)",
        },
      ]);
      return;
    }

    if (!isAuthenticated()) {
      setTurns((t) => [
        ...t,
        { id: idRef.current++, role: "user", content: trimmed },
        {
          id: idRef.current++,
          role: "system",
          content: "Not signed in. Quit and run `elliot login`.",
        },
      ]);
      return;
    }

    const userId = idRef.current++;
    const assistantId = idRef.current++;
    setTurns((t) => [
      ...t,
      { id: userId, role: "user", content: trimmed },
      { id: assistantId, role: "assistant", content: "", pending: true },
    ]);
    setPending(true);

    try {
      const t0 = Date.now();
      const resp = await ask(trimmed);
      const ms = Date.now() - t0;
      const meta = [
        resp.model,
        resp.input_tokens != null && resp.output_tokens != null
          ? `${resp.input_tokens}→${resp.output_tokens} tok`
          : null,
        resp.cost_usd != null ? `$${resp.cost_usd.toFixed(4)}` : null,
        `${ms}ms`,
      ]
        .filter(Boolean)
        .join(" · ");

      setTurns((t) =>
        t.map((x) =>
          x.id === assistantId
            ? { ...x, content: resp.answer, meta, pending: false }
            : x,
        ),
      );
    } catch (e) {
      setTurns((t) =>
        t.map((x) =>
          x.id === assistantId
            ? {
                ...x,
                content: `error: ${String(e).slice(0, 200)}`,
                pending: false,
              }
            : x,
        ),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Box flexDirection="column">
      <Header org={org} email={cfg.email} apiUrl={cfg.apiUrl} reachable={reachable} />
      <Conversation turns={turns} />
      <Box borderStyle="single" borderColor={theme.muted} paddingX={1}>
        <Text color={theme.prompt}>{pending ? "  " : "> "}</Text>
        <TextInput
          value={input}
          onChange={(v) => {
            setInput(v);
            if (histOffset !== -1) {
              setHistOffset(-1);
              setDraft(v);
            }
          }}
          onSubmit={submit}
          placeholder="ask anything..."
          focus={!pending}
        />
      </Box>
    </Box>
  );
}

export async function replCommand(): Promise<number> {
  const { waitUntilExit } = render(<Repl />);
  await waitUntilExit();
  return 0;
}
