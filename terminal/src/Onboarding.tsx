import { useState } from "react";
import Step1SignIn from "./steps/Step1SignIn";
import Step2Workspace from "./steps/Step2Workspace";
import Step3SDLC from "./steps/Step3SDLC";
import Step4Sources from "./steps/Step4Sources";
import Step5IndexKnowledge from "./steps/Step5IndexKnowledge";
import Step6Launch from "./steps/Step6Launch";

interface OnboardingConfig {
  jwtToken?: string;
  tenantId?: string;
  userId?: string;
  teamId?: string;
  orgName?: string;
  stack?: string;
}

const STEPS = [
  { id: 1, title: "Sign in", subtitle: "SSO / identity" },
  { id: 2, title: "Workspace", subtitle: "Org setup" },
  { id: 3, title: "SDLC Profile", subtitle: "Engineering standards" },
  { id: 4, title: "Connect Sources", subtitle: "Integrations" },
  { id: 5, title: "Index Knowledge", subtitle: "Knowledge base" },
  { id: 6, title: "Launch", subtitle: "Setup complete" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [config, setConfig] = useState<OnboardingConfig>({});

  const handleContinue = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const updateConfig = (updates: Partial<OnboardingConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1SignIn onContinue={handleContinue} />;
      case 2:
        return <Step2Workspace onContinue={handleContinue} onConfigUpdate={updateConfig} />;
      case 3:
        return <Step3SDLC onContinue={handleContinue} onConfigUpdate={updateConfig} />;
      case 4:
        return <Step4Sources onContinue={handleContinue} />;
      case 5:
        return <Step5IndexKnowledge onContinue={handleContinue} />;
      case 6:
        return <Step6Launch config={config} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", flexDirection: "column" }}>
      {/* TOP BAR */}
      <div style={{ height: "48px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: "600" }}>
            <span style={{ color: "var(--accent-blue)" }}>[·]</span>
            <span style={{ color: "var(--text-primary)" }}>ELLIOT-AI</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>$ elliot init</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
          <span style={{ color: "var(--accent-green)", fontSize: "6px" }}>●</span>
          elliot-ai.cloud · tenant provisioning
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT SIDEBAR */}
        <div style={{ width: "210px", background: "var(--surface)", borderRight: "1px solid var(--border)", padding: "24px 0", display: "flex", flexDirection: "column", overflow: "auto", flexShrink: 0 }}>
          {/* Steps */}
          <div style={{ flex: 1 }}>
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isCompleted = completedSteps.has(step.id);

              return (
                <div key={step.id}>
                  {/* Vertical Line */}
                  {idx < STEPS.length - 1 && (
                    <div style={{ height: "22px", display: "flex", justifyContent: "center", paddingTop: "0px" }}>
                      <div style={{ width: "1px", background: "var(--border)" }} />
                    </div>
                  )}

                  {/* Step Item */}
                  <div style={{ padding: "10px 20px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    {/* Circle */}
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        flexShrink: 0,
                        background: isActive ? "var(--accent-blue)" : isCompleted ? "var(--accent-green)" : "transparent",
                        border: isActive || isCompleted ? "none" : "1px solid var(--border)",
                        color: isActive ? "white" : isCompleted ? "black" : "var(--text-muted)",
                        fontFamily: isActive ? "var(--font-mono)" : "var(--font-sans)",
                      }}
                    >
                      {isCompleted ? "✓" : step.id}
                    </div>

                    {/* Labels */}
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: isActive ? "600" : "400", color: isActive ? "var(--text-primary)" : isCompleted ? "var(--text-secondary)" : "var(--text-muted)", fontFamily: "var(--font-sans)" }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: "400", color: "var(--text-muted)", marginTop: "2px", fontFamily: "var(--font-sans)" }}>
                        {step.subtitle}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Info */}
          <div style={{ padding: "20px", borderTop: "1px solid var(--border)", fontSize: "11px", fontWeight: "400", color: "var(--text-muted)", display: "flex", alignItems: "flex-start", gap: "6px", fontFamily: "var(--font-sans)" }}>
            <span style={{ color: "var(--accent-green)", fontSize: "6px", marginTop: "3px", flexShrink: 0 }}>●</span>
            <span style={{ lineHeight: "1.4" }}>Secure setup · SOC 2 · encrypted at rest</span>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, background: "var(--bg)", overflowY: "auto", padding: "40px 48px" }}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
