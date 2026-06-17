import { useState } from "react";
import Step1SignIn from "./steps/Step1SignIn";
import Step2Workspace from "./steps/Step2Workspace";
import Step3SDLC from "./steps/Step3SDLC";
import Step4Sources from "./steps/Step4Sources";
import Step5IndexKnowledge from "./steps/Step5IndexKnowledge";
import Step6Launch from "./steps/Step6Launch";

interface Step {
  id: number;
  title: string;
  subtitle: string;
}

interface OnboardingProps {
  onComplete?: () => void;
}

const STEPS: Step[] = [
  { id: 1, title: "Sign in", subtitle: "SSO / identity" },
  { id: 2, title: "Workspace", subtitle: "Org setup" },
  { id: 3, title: "SDLC Profile", subtitle: "Engineering standards" },
  { id: 4, title: "Connect Sources", subtitle: "Integrations" },
  { id: 5, title: "Index Knowledge", subtitle: "Knowledge base" },
  { id: 6, title: "Launch", subtitle: "Setup complete" },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleContinue = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1SignIn onContinue={handleContinue} />;
      case 2:
        return <Step2Workspace onContinue={handleContinue} onBack={handleBack} />;
      case 3:
        return <Step3SDLC onContinue={handleContinue} onBack={handleBack} />;
      case 4:
        return <Step4Sources onContinue={handleContinue} onBack={handleBack} />;
      case 5:
        return <Step5IndexKnowledge onContinue={handleContinue} onBack={handleBack} />;
      case 6:
        return <Step6Launch onComplete={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">[·]</span>
          <span className="sidebar-logo-text">ELLIOT-AI</span>
        </div>
        <div className="sidebar-subtitle">$ elliot init</div>

        <div className="steps-list">
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            const isInactive = step.id > currentStep && !isCompleted;

            return (
              <div
                key={step.id}
                className={`step-item ${isActive ? "active" : ""} ${
                  isCompleted ? "completed" : ""
                } ${isInactive ? "inactive" : ""}`}
              >
                <div className="step-circle">
                  {isCompleted ? "✓" : step.id}
                </div>
                <div className="step-label-group">
                  <div className="step-title">{step.title}</div>
                  <div className="step-subtitle">{step.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <span className="sidebar-bottom-dot" />
          Secure setup · SOC 2 · encrypted at rest
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          {currentStep > 1 && (
            <button className="top-bar-back" onClick={handleBack}>
              ← Back
            </button>
          )}
          {currentStep === 1 && <div />}
          <div className="top-bar-status">
            <span className="status-dot" />
            elliot-ai.cloud · tenant provisioning
          </div>
        </div>

        {renderStep()}
      </div>

      <div className="right-panel">
        <div className="panel-section">
          <div className="panel-title">Status</div>
          <div className="panel-item">Initializing workspace...</div>
        </div>
      </div>
    </div>
  );
}
