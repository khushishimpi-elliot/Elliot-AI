import { useState } from "react";

interface Step3Props {
  onContinue: () => void;
  onBack: () => void;
}

export default function Step3SDLC({ onContinue, onBack }: Step3Props) {
  const [stack, setStack] = useState(["TypeScript/Node"]);
  const [branching, setBranching] = useState("trunk-based");
  const [testing, setTesting] = useState("vitest-90");
  const [cicd, setCicd] = useState(["GitHub Actions"]);
  const [review, setReview] = useState("2-approvals");

  const toggleMultiSelect = (value: string, current: string[]) => {
    if (current.includes(value)) {
      return current.filter((v) => v !== value);
    }
    return [...current, value];
  };

  return (
    <div className="step-content">
      <div className="step-header">
        <button className="step-back" onClick={onBack}>←</button>
        <div className="step-label">SDLC PROFILE · STEP 3 OF 6</div>
        <h1>Teach Elliot your SDLC</h1>
        <p className="step-description">
          Elliot adapts every plan, diff and test to these standards — and enforces them
          automatically. Pre-filled from detected signals; adjust anything.
        </p>
      </div>

      <div className="step-body">
        <div className="form-group">
          <label className="form-label">PRIMARY STACK</label>
          <div className="toggle-group multi">
            {["TypeScript/Node", "Python", "Go", "Java/Kotlin", ".NET/C#", "Ruby", "Rust"].map(
              (lang) => (
                <button
                  key={lang}
                  className={`toggle-btn ${stack.includes(lang) ? "active" : ""}`}
                  onClick={() => setStack(toggleMultiSelect(lang, stack))}
                >
                  {lang}
                </button>
              )
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">BRANCHING MODEL</label>
          <div className="toggle-group">
            {[
              { value: "trunk-based", label: "Trunk-based" },
              { value: "github-flow", label: "GitHub Flow" },
              { value: "gitflow", label: "GitFlow" },
              { value: "release", label: "Release branches" },
            ].map((mode) => (
              <button
                key={mode.value}
                className={`toggle-btn ${branching === mode.value ? "active" : ""}`}
                onClick={() => setBranching(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">TEST FRAMEWORK & COVERAGE GATE</label>
          <div className="toggle-group">
            {[
              { value: "vitest-90", label: "Vitest · 90% gate" },
              { value: "jest-80", label: "Jest · 80% gate" },
              { value: "pytest-85", label: "PyTest · 85% gate" },
              { value: "junit-80", label: "JUnit · 80% gate" },
              { value: "no-gate", label: "No hard gate" },
            ].map((test) => (
              <button
                key={test.value}
                className={`toggle-btn ${testing === test.value ? "active" : ""}`}
                onClick={() => setTesting(test.value)}
              >
                {test.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">CI / CD PLATFORM</label>
          <div className="toggle-group multi">
            {["GitHub Actions", "GitLab CI", "Jenkins", "CircleCI", "Azure Pipelines"].map(
              (platform) => (
                <button
                  key={platform}
                  className={`toggle-btn ${cicd.includes(platform) ? "active" : ""}`}
                  onClick={() => setCicd(toggleMultiSelect(platform, cicd))}
                >
                  {platform}
                </button>
              )
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">CODE REVIEW POLICY</label>
          <div className="toggle-group">
            {[
              { value: "1-approval", label: "1 approval" },
              { value: "2-approvals", label: "2 approvals" },
              { value: "codeowners", label: "CODEOWNERS required" },
              { value: "approval-green", label: "Approval + green CI" },
            ].map((policy) => (
              <button
                key={policy.value}
                className={`toggle-btn ${review === policy.value ? "active" : ""}`}
                onClick={() => setReview(policy.value)}
              >
                {policy.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onContinue} className="btn btn-primary">
          Continue →
        </button>
      </div>
    </div>
  );
}
