import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Step3Props {
  onContinue: () => void;
  onConfigUpdate?: (config: { stack?: string }) => void;
  onBack?: () => void;
}

export default function Step3SDLC({ onContinue, onConfigUpdate }: Step3Props) {
  const [stack, setStack] = useState<string[]>(["TypeScript/Node"]);
  const [branching, setBranching] = useState("trunk-based");
  const [testing, setTesting] = useState("vitest");
  const [cicd, setCicd] = useState<string[]>(["GitHub Actions"]);
  const [review, setReview] = useState("2 approvals");

  const handleContinue = async () => {
    try {
      const token = localStorage.getItem("elliot_token");
      const tenantId = localStorage.getItem("elliot_tenant_id");
      await fetch(`${API_URL}/onboarding/sdlc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          primary_stack: stack.join(" / "),
          branching_model: branching,
          test_framework: testing,
          ci_platform: cicd.join(", "),
          review_policy: review,
        }),
      });
    } catch {
      // backend unavailable — continue anyway
    }

    // Save to localStorage for Step 6
    localStorage.setItem("elliot_stack", stack.join(", "));
    localStorage.setItem("elliot_branching_model", branching);
    const testParts = testing.split(" · ");
    localStorage.setItem("elliot_test_framework", testParts[0]);
    localStorage.setItem("elliot_coverage_gate", testParts[1]?.replace("%", "") || "0");
    localStorage.setItem("elliot_review_policy", review);
    localStorage.setItem("elliot_ci_cd_platform", cicd.join(", "));

    if (onConfigUpdate) onConfigUpdate({ stack: stack.join(" / ") });
    onContinue();
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", fontWeight: "500", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-blue)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          ENGINEERING PROFILE · STEP 3 OF 6
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "12px", fontFamily: "var(--font-sans)" }}>
          Teach Elliot your SDLC
        </h1>
        <p style={{ fontSize: "14px", fontWeight: "400", color: "var(--text-secondary)", maxWidth: "520px", fontFamily: "var(--font-sans)" }}>
          Elliot adapts every plan, diff and test to these standards.
        </p>
      </div>

      <div style={{ maxWidth: "600px", marginBottom: "32px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>Primary stack</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["TypeScript/Node", "Python", "Go", "Java/Kotlin", ".NET/C#", "Ruby", "Rust"].map((opt) => (
              <button key={opt} onClick={() => setStack(stack.includes(opt) ? stack.filter(s => s !== opt) : [...stack, opt])} style={{ padding: "6px 14px", background: stack.includes(opt) ? "var(--surface-2)" : "transparent", border: `1px solid ${stack.includes(opt) ? "var(--accent-blue)" : "var(--border)"}`, borderRadius: "4px", color: stack.includes(opt) ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s ease" }}>{opt}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>Branching model</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["Trunk-based", "GitHub Flow", "GitFlow", "Release branches"].map((opt) => (
              <button key={opt} onClick={() => setBranching(opt)} style={{ padding: "6px 14px", background: branching === opt ? "var(--surface-2)" : "transparent", border: `1px solid ${branching === opt ? "var(--accent-blue)" : "var(--border)"}`, borderRadius: "4px", color: branching === opt ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s ease" }}>{opt}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>Test framework & coverage gate</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["Vitest · 90%", "Jest · 80%", "PyTest · 85%", "JUnit · 80%"].map((opt) => (
              <button key={opt} onClick={() => setTesting(opt)} style={{ padding: "6px 14px", background: testing === opt ? "var(--surface-2)" : "transparent", border: `1px solid ${testing === opt ? "var(--accent-blue)" : "var(--border)"}`, borderRadius: "4px", color: testing === opt ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s ease" }}>{opt}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>CI / CD platform</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["GitHub Actions", "GitLab CI", "Jenkins", "CircleCI", "Azure Pipelines"].map((opt) => (
              <button key={opt} onClick={() => setCicd(cicd.includes(opt) ? cicd.filter(c => c !== opt) : [...cicd, opt])} style={{ padding: "6px 14px", background: cicd.includes(opt) ? "var(--surface-2)" : "transparent", border: `1px solid ${cicd.includes(opt) ? "var(--accent-blue)" : "var(--border)"}`, borderRadius: "4px", color: cicd.includes(opt) ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s ease" }}>{opt}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>Code review policy</h3>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["1 approval", "2 approvals", "CODEOWNERS required", "Approval + green CI"].map((opt) => (
              <button key={opt} onClick={() => setReview(opt)} style={{ padding: "6px 14px", background: review === opt ? "var(--surface-2)" : "transparent", border: `1px solid ${review === opt ? "var(--accent-blue)" : "var(--border)"}`, borderRadius: "4px", color: review === opt ? "var(--text-primary)" : "var(--text-secondary)", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s ease" }}>{opt}</button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleContinue} style={{ background: "var(--accent-blue)", color: "white", border: "none", borderRadius: "5px", fontSize: "14px", fontWeight: "600", padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Continue →</button>
    </div>
  );
}
