import { useState } from "react";
import Step1SignIn from "./steps/Step1SignIn";
import Step2Workspace from "./steps/Step2Workspace";
import Step3SDLC from "./steps/Step3SDLC";
import Step4Sources from "./steps/Step4Sources";
import Step5IndexKnowledge from "./steps/Step5IndexKnowledge";
import Step6Launch from "./steps/Step6Launch";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    { number: 1, name: "Sign in", subtitle: "SSO / identity" },
    { number: 2, name: "Workspace", subtitle: "Org & client" },
    { number: 3, name: "SDLC profile", subtitle: "Engineering standards" },
    { number: 4, name: "Connect sources", subtitle: "Repos · tickets · docs" },
    { number: 5, name: "Index knowledge", subtitle: "Build the RAG" },
    { number: 6, name: "Launch", subtitle: "Setup complete" },
  ];

  const handleStepComplete = () => {
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
        return <Step1SignIn onContinue={handleStepComplete} />;
      case 2:
        return <Step2Workspace onContinue={handleStepComplete} onBack={handleBack} />;
      case 3:
        return <Step3SDLC onContinue={handleStepComplete} onBack={handleBack} />;
      case 4:
        return <Step4Sources onContinue={handleStepComplete} onBack={handleBack} />;
      case 5:
        return <Step5IndexKnowledge onContinue={handleStepComplete} onBack={handleBack} />;
      case 6:
        return <Step6Launch onComplete={() => {}} />;
      default:
        return null;
    }
  };

  return (
    <div className="onboarding-container">
      <aside className="onboarding-sidebar">
        <div className="onboarding-logo">
          <span className="logo-icon">[·]</span>
          <span className="logo-text">ELLIOT-AI</span>
        </div>
        <div className="onboarding-init">$ elliot init</div>

        <ul className="onboarding-steps">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.number);
            const isActive = currentStep === step.number;

            return (
              <li
                key={step.number}
                className={`onboarding-step ${isActive ? "active" : ""} ${
                  isCompleted ? "completed" : ""
                }`}
              >
                <div className="onboarding-step-circle">
                  {isCompleted ? "✓" : step.number}
                </div>
                <div className="onboarding-step-content">
                  <div className="onboarding-step-name">{step.name}</div>
                  <div className="onboarding-step-subtitle">{step.subtitle}</div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="onboarding-footer">
          <span className="footer-dot">●</span>
          Secure setup · SOC 2 · encrypted at rest
        </div>
      </aside>

      <main className="onboarding-main">
        <div className="onboarding-top-bar">
          <div className="onboarding-status">
            <span className="status-dot">●</span>
            elliot-ai.cloud · tenant provisioning
          </div>
        </div>

        <div className="onboarding-content">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
