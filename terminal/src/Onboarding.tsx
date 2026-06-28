import { useState, useEffect } from "react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const step = params.get("step");
    const jwt = params.get("jwt");
    const email = params.get("email");

    if (step) {
      setCurrentStep(parseInt(step, 10));
    }
    if (jwt) {
      localStorage.setItem("jwt", jwt);
      setConfig((prev) => ({ ...prev, jwtToken: jwt }));

      // Extract tenant_id from JWT payload
      try {
        const payload = JSON.parse(atob(jwt.split(".")[1]));
        if (payload.tenant_id) {
          localStorage.setItem("elliot_tenant_id", payload.tenant_id);
          setConfig((prev) => ({ ...prev, tenantId: payload.tenant_id }));
        }
      } catch {
        console.error("Failed to extract tenant_id from JWT");
      }
    }
    if (email) {
      localStorage.setItem("email", email);
    }
  }, []);

  const handleContinue = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepId: number) => {
    if (stepId < currentStep || completedSteps.has(stepId)) {
      setCurrentStep(stepId);
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
                  <div
                    onClick={() => goToStep(step.id)}
                    style={{
                      padding: "10px 20px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      cursor: (step.id < currentStep || completedSteps.has(step.id)) ? "pointer" : "default",
                      opacity: step.id > currentStep && !completedSteps.has(step.id) ? 0.45 : 1,
                      borderRadius: "4px",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (step.id < currentStep || completedSteps.has(step.id)) {
                        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                  >
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
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                padding: "0",
                marginBottom: "24px",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
            >
              ← Back
            </button>
          )}
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
