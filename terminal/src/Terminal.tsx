import { useState, useEffect, useRef } from "react";
import { ELLIOT } from "./data";

interface Block {
  type: "prompt" | "agenthead" | "p" | "system" | "tool" | "approval";
  text?: string;
  agent?: string;
  reveal?: number | null;
  items?: Array<{ k: string; v: string; tone?: string }>;
  tool?: { name: string; lines?: Array<{ k: string; v: string }> };
  status?: "running" | "done";
  proposed?: Array<{ label: string; risk?: string | null }>;
  decision?: string | null;
  title?: string;
}

export default function Terminal() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [phase, setPhase] = useState<"idle" | "running" | "awaiting" | "done">("idle");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [usedAgents, setUsedAgents] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState(ELLIOT.RUN.contextSources.slice(0, 1));

  const scrollRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<Block[]>([]);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [blocks]);

  const sync = () => setBlocks(blocksRef.current.slice());
  const push = (b: Block) => {
    blocksRef.current.push(b);
    sync();
    return blocksRef.current.length - 1;
  };
  const upd = (i: number, patch: Partial<Block>) => {
    if (blocksRef.current[i]) {
      blocksRef.current[i] = { ...blocksRef.current[i], ...patch };
      sync();
    }
  };

  const tokens = sources.reduce((s, x) => s + (x.tokens || 0), 0);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function streamPara(text: string, runId: number) {
    const i = push({ type: "p", text, reveal: 0 });
    const chunk = Math.max(3, Math.ceil(text.length / 14));
    for (let r = chunk; r < text.length; r += chunk) {
      if (runId !== runIdRef.current) return;
      upd(i, { reveal: r });
      await sleep(34);
    }
    upd(i, { reveal: null });
  }

  async function runDemo() {
    const runId = ++runIdRef.current;
    setPhase("running");
    setUsedAgents(new Set());
    setSources(ELLIOT.RUN.contextSources.slice(0, 2));

    push({ type: "agenthead", agent: "architect" });

    for (const b of ELLIOT.RUN.transcripts.intro) {
      await streamPara(b.text, runId);
      if (runId !== runIdRef.current) return;
    }

    for (let s = 0; s < ELLIOT.RUN.steps.length; s++) {
      const step = ELLIOT.RUN.steps[s];
      if (runId !== runIdRef.current) return;

      setActiveAgent(step.agent);
      setUsedAgents((prev) => new Set(prev).add(step.agent));

      let toolIdx = null;
      if (step.tool) toolIdx = push({ type: "tool", tool: step.tool, status: "running" });

      await sleep(step.dur / 10);
      if (runId !== runIdRef.current) return;
      if (step.tool && toolIdx !== null) upd(toolIdx, { status: "done" });
    }

    setActiveAgent(null);
    push({ type: "approval", proposed: ELLIOT.RUN.proposed, decision: null });
    setPhase("awaiting");
  }

  async function finishRun(decision: string) {
    const runId = ++runIdRef.current;
    setPhase("running");
    push({ type: "agenthead", agent: "qa" });

    if (decision === "approved") {
      for (const b of ELLIOT.RUN.transcripts.summary) {
        await streamPara(b.text, runId);
        if (runId !== runIdRef.current) return;
      }
    } else {
      await streamPara(
        "Understood — I'll skip the production pipeline change. The tests and docs are staged on `feature/refund-flow` for your review.",
        runId
      );
    }
    setPhase("done");
  }

  function decide(d: string) {
    const i = blocksRef.current.findIndex((b) => b.type === "approval" && b.decision == null);
    if (i < 0) return;
    upd(i, { decision: d });
    finishRun(d);
  }

  function onSubmit(text: string) {
    if (phase === "awaiting") {
      if (/^(y|yes)$/i.test(text)) { decide("approved"); return; }
      if (/^(n|no)$/i.test(text)) { decide("rejected"); return; }
    }

    const lower = text.toLowerCase();
    const slash = lower.split(" ")[0];

    if (slash === "/clear") {
      runIdRef.current++;
      blocksRef.current = [];
      sync();
      setPhase("idle");
      setUsedAgents(new Set());
      setSources(ELLIOT.RUN.contextSources.slice(0, 1));
      setActiveAgent(null);
      return;
    }

    push({ type: "prompt", text });

    if (["/help", "/project", "/knowledge", "/agents", "/context"].includes(slash)) {
      push({ type: "system", title: `${slash} command`, items: [{ k: "status", v: "Command executed", tone: "success" }] });
      return;
    }

    runDemo();
  }

  const busy = phase === "running";
  const max = ELLIOT.RUN.contextMax;
  const pct = Math.min(100, (tokens / max) * 100);
  const fmt = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header style={{ height: "var(--statusbar)", flex: "none", display: "flex", alignItems: "center", gap: 18, padding: "0 16px", borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg, #0E131C, var(--panel))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Logo size={17} />
          <span style={{ fontWeight: 700, letterSpacing: "0.04em", color: "var(--text)" }}>ELLIOT<span style={{ color: "var(--accent)" }}>-AI</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 10px", borderRadius: 20, background: "var(--success-soft)", border: "1px solid rgba(93,216,155,0.22)" }}>
          <span className="dot" style={{ background: "var(--success)", animation: "pulse-dot 1.8s ease-in-out infinite" }} />
          <span style={{ color: "var(--success)", fontSize: 11.5, fontWeight: 600 }}>Connected</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "var(--text-faint)", fontSize: 11.5 }}>elliot-engineer-v2</span>
          <span style={{ color: "var(--border-glow)" }}>·</span>
          <span style={{ color: "var(--text-dim)", fontSize: 11.5 }}>production</span>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <aside style={{ width: "var(--col-left)", flex: "none", borderRight: "1px solid var(--border)", background: "var(--panel)", overflowY: "auto", padding: "calc(var(--gut) * 0.9) var(--gut)" }}>
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border-soft)" }}>
            <div className="mono-label" style={{ marginBottom: 7 }}>PROJECT</div>
            <div style={{ color: "var(--text)", fontSize: "calc(var(--fs) - 0.5px)", fontWeight: 500, marginBottom: 12 }}>{ELLIOT.PROJECT.project}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "calc(var(--fs) - 0.5px)" }}>
              <div><span style={{ color: "var(--text-faint)" }}>repo</span> {ELLIOT.PROJECT.repo}</div>
              <div><span style={{ color: "var(--text-faint)" }}>branch</span> {ELLIOT.PROJECT.branch}</div>
            </div>
          </div>
          <div>
            <div className="mono-label" style={{ marginBottom: 7 }}>CONNECTED</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ELLIOT.CONNECTED.slice(0, 5).map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "calc(var(--fs) - 0.5px)" }}>
                  <span className="dot" style={{ background: "var(--success)", color: "var(--success)", animation: "pulse-dot 1.8s infinite" }} />
                  <span style={{ color: "var(--text)", flex: 1 }}>{s.label}</span>
                  <span style={{ color: "var(--text-faint)" }}>{s.meta}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "8px 26px 4px", scrollBehavior: "smooth" }}>
            <pre style={{ color: "var(--accent)", fontSize: "calc(var(--fs) - 1px)", lineHeight: 1.35, margin: "8px 0 6px", fontWeight: 600 }}>
{`  ___ _ _ _      _      _   ___
 | __| | (_)___| |_   /_\\ |_ _|
 | _|| | | / _ \\  _| / _ \\ | |
 |___|_|_|_\\___/\\__|/_/ \\_\\___|`}
            </pre>
            <div style={{ color: "var(--text-dim)", marginTop: 12, maxWidth: 700, lineHeight: 1.7, marginBottom: 14 }}>
              Organization AI Engineer — connected to your repositories, standards, and knowledge base. I plan, build, test and validate with full context.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {["create unit tests for the refund service", "/agents", "/context", "/help"].map((s) => (
                <button key={s} onClick={() => { if (!busy) onSubmit(s); }} style={{ color: "var(--text-faint)", fontSize: 11, padding: "4px 9px", borderRadius: 5, background: "var(--elevated)", border: "1px solid var(--border-soft)", fontFamily: "var(--mono)", cursor: "pointer", transition: "all .15s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--elevated-2)"; e.currentTarget.style.borderColor = "var(--border-glow)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.background = "var(--elevated)"; e.currentTarget.style.borderColor = "var(--border-soft)"; }}>{s}</button>
              ))}
            </div>
            {blocks.map((b, i) => (<Block key={i} b={b} onDecide={decide} />))}
            <div style={{ height: 8 }} />
          </div>

          <div style={{ padding: "12px 22px 16px", borderTop: "1px solid var(--border)", background: "linear-gradient(180deg, var(--panel), #0B0F16)", flex: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 15px", borderRadius: "var(--radius)", background: "var(--elevated)", border: `1px solid var(--border)` }}>
              <span style={{ color: busy ? "var(--text-faint)" : "var(--accent)", fontWeight: 700, flex: "none" }}>{busy ? <span className="spinner" /> : ">"}</span>
              <input autoFocus disabled={busy} onChange={() => { if (!busy) document.getElementById("input-field")?.focus(); }} onKeyDown={(e) => { if (e.key === "Enter" && !busy) { const inp = document.getElementById("input-field") as HTMLInputElement; onSubmit(inp.value); inp.value = ""; } }} id="input-field" placeholder={busy ? "Elliot is working…" : "Ask Elliot"} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontFamily: "var(--mono)", fontSize: "var(--fs)", caretColor: "var(--accent)" }} />
            </div>
          </div>
        </main>

        <aside style={{ width: "var(--col-right)", flex: "none", borderLeft: "1px solid var(--border)", background: "var(--panel)", overflowY: "auto", padding: "calc(var(--gut) * 0.9) var(--gut)" }}>
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border-soft)" }}>
            <div className="mono-label" style={{ marginBottom: 7 }}>AGENTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ELLIOT.AGENTS.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", borderRadius: "var(--radius-sm)", background: activeAgent === a.id ? "var(--elevated-2)" : "transparent", border: `1px solid ${activeAgent === a.id ? a.color : "var(--border-soft)"}` }}>
                  <span className="dot" style={{ background: usedAgents.has(a.id) || activeAgent === a.id ? a.color : "var(--text-ghost)", color: usedAgents.has(a.id) || activeAgent === a.id ? a.color : "var(--text-ghost)", animation: activeAgent === a.id ? "pulse-dot 1.8s infinite" : "none" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: usedAgents.has(a.id) || activeAgent === a.id ? "var(--text)" : "var(--text-dim)", fontSize: "calc(var(--fs) - 0.5px)", fontWeight: 500 }}>{a.name}</div>
                    <div style={{ color: "var(--text-faint)", fontSize: 10 }}>{a.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mono-label" style={{ marginBottom: 7 }}>CONTEXT</div>
            <div style={{ display: "flex", height: 8, borderRadius: 5, overflow: "hidden", background: "var(--elevated)", marginBottom: 10, border: "1px solid var(--border-soft)" }}>
              {sources.map((s) => (<div key={s.label} style={{ width: `${(s.tokens / max) * 100}%`, background: s.color, transition: "width .6s cubic-bezier(.2,.7,.3,1)" }} />))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {sources.map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flex: "none" }} />
                  <span style={{ color: "var(--text-dim)", fontSize: 11, flex: 1 }}>{s.label}</span>
                  <span style={{ color: "var(--text-faint)", fontSize: 10.5 }}>{fmt(s.tokens)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--text-faint)", display: "flex", justifyContent: "space-between" }}>
              <span>{pct.toFixed(0)}% used</span>
              <span style={{ color: "var(--success)" }}>{fmt(max - tokens)} free</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Logo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 5 L4 5 L4 19 L9 19" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5 L20 5 L20 19 L15 19" stroke="var(--ai)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

function Block({ b, onDecide }: { b: Block; onDecide: (d: string) => void }) {
  if (b.type === "prompt") {
    return <div style={{ display: "flex", gap: 10, alignItems: "baseline", margin: "18px 0 12px", animation: "fade-up 0.3s cubic-bezier(.2,.7,.3,1)" }}><span style={{ color: "var(--accent)", fontWeight: 700, flex: "none" }}>&gt;</span><span style={{ color: "var(--text)", fontWeight: 500 }}>{b.text}</span></div>;
  }
  if (b.type === "agenthead") {
    const a = ELLIOT.AGENTS.find((x) => x.id === b.agent);
    return <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7, animation: "fade-up 0.3s cubic-bezier(.2,.7,.3,1)" }}><Logo size={13} /><span style={{ color: "var(--text-faint)", fontSize: 10.5, letterSpacing: "0.04em" }}>elliot</span><span style={{ color: "var(--border-glow)", fontSize: 10.5 }}>·</span><span style={{ width: 6, height: 6, borderRadius: 2, background: a?.color }} /><span style={{ color: "var(--text-faint)", fontSize: 10.5 }}>{a?.name}</span></div>;
  }
  if (b.type === "p") {
    const shown = b.reveal == null ? b.text : b.text?.slice(0, b.reveal);
    const typing = b.reveal != null && b.reveal < (b.text?.length ?? 0);
    return <div style={{ color: "var(--text-dim)", margin: "2px 0 12px", maxWidth: 760, animation: "fade-up 0.3s cubic-bezier(.2,.7,.3,1)" }}>{shown}{typing && <span style={{ color: "var(--accent)", animation: "blink 1s step-end infinite" }}>▋</span>}</div>;
  }
  if (b.type === "system") {
    return <div style={{ margin: "4px 0 14px", maxWidth: 640, animation: "fade-up 0.3s cubic-bezier(.2,.7,.3,1)" }}>{b.title && <div style={{ color: "var(--text-faint)", fontSize: 11, marginBottom: 7 }}>{b.title}</div>}<div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px" }}>{b.items?.map((it, i) => <div key={i} style={{ display: "contents" }}><span style={{ color: "var(--accent)", fontWeight: 600 }}>{it.k}</span><span style={{ color: "var(--text-dim)" }}>{it.v}</span></div>)}</div></div>;
  }
  if (b.type === "tool") {
    return <div style={{ margin: "4px 0 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--elevated)", maxWidth: 560, overflow: "hidden", animation: "fade-up 0.3s cubic-bezier(.2,.7,.3,1)" }}><div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 13px", borderBottom: "1px solid var(--border-soft)" }}><span style={{ color: "var(--ai)", fontSize: 13 }}>⌘</span><span style={{ color: "var(--text)", fontWeight: 600, fontSize: "calc(var(--fs) - 0.5px)" }}>Tool</span><span style={{ color: "var(--border-glow)" }}>·</span><span style={{ color: "var(--ai)", fontSize: "calc(var(--fs) - 0.5px)" }}>{b.tool?.name}</span><span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>{b.status === "running" ? <><span className="spinner" /><span style={{ color: "var(--text-faint)", fontSize: 10.5 }}>running</span></> : <><span style={{ color: "var(--success)", fontSize: 11 }}>✓</span><span style={{ color: "var(--success)", fontSize: 10.5 }}>done</span></>}</span></div><div style={{ padding: "10px 13px" }}>{b.tool?.lines?.map((ln, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < (b.tool?.lines?.length ?? 0) - 1 ? 8 : 0, opacity: b.status === "running" ? 0.4 : 1 }}><span style={{ color: "var(--text-faint)", fontSize: 10.5, width: 78, flex: "none" }}>{ln.k}</span><span style={{ color: "var(--text-dim)", fontSize: 11.5 }}>{b.status === "running" ? "…" : ln.v}</span></div>)}</div></div>;
  }
  if (b.type === "approval") {
    return <div style={{ margin: "4px 0 14px", borderRadius: "var(--radius)", border: "1px solid var(--warning)", background: "linear-gradient(180deg, var(--warning-soft), var(--elevated))", padding: "13px 15px", maxWidth: 560, animation: "fade-up 0.3s cubic-bezier(.2,.7,.3,1)" }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}><span style={{ color: "var(--warning)", fontSize: 12 }}>⚠</span><span style={{ color: "var(--text)", fontWeight: 600, fontSize: "calc(var(--fs) - 0.5px)" }}>Approval Required</span></div><div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 13 }}>{b.proposed?.map((a, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ color: "var(--success)", flex: "none", fontWeight: 700 }}>✓</span><span style={{ color: "var(--text-dim)", flex: 1 }}>{a.label}</span></div>)}</div>{b.decision == null ? <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ color: "var(--text-faint)", fontSize: 11.5 }}>Approve?</span><button onClick={() => onDecide("approved")} style={{ padding: "5px 11px", borderRadius: "var(--radius-sm)", background: "var(--success)", color: "#06140D", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", border: "none" }}>Approve</button><button onClick={() => onDecide("rejected")} style={{ padding: "5px 11px", borderRadius: "var(--radius-sm)", background: "transparent", border: "1px solid var(--error)", color: "var(--error)", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Reject</button></div> : <div style={{ color: b.decision === "approved" ? "var(--success)" : "var(--error)", fontWeight: 600, fontSize: "calc(var(--fs) - 0.5px)" }}>{b.decision === "approved" ? "✓ Approved" : "✕ Rejected"}</div>}</div>;
  }
  return null;
}