import logo from "../assets/elliot-logo.png";

function OnboardingSidebar({
  currentStep,
  onStepClick,
}) {
  const steps = [
    {
      title: "Sign in",
      subtitle: "SSO / identity",
    },
    {
      title: "Workspace",
      subtitle: "Org & client",
    },
    {
      title: "SDLC Profile",
      subtitle: "Engineering standards",
    },
    {
      title: "Connect Sources",
      subtitle: "Repos · tickets · docs",
    },
    {
      title: "Index Knowledge",
      subtitle: "Build the RAG",
    },
    {
      title: "Launch",
      subtitle: "Open the terminal",
    },
  ];

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-header">
          <img
            src={logo}
            alt="Elliot AI"
            className="logo"
          />

          <p className="init-text">
            $ elliot init
          </p>
        </div>

        <div className="steps">
          {steps.map((step, index) => {
            const stepNumber = index + 1;

            const completed =
              stepNumber < currentStep;

            const active =
              stepNumber === currentStep;

            const canNavigate =
              stepNumber <= currentStep;

            return (
              <div
                key={index}
                className="step"
                onClick={() => {
                  if (canNavigate) {
                    onStepClick(stepNumber);
                  }
                }}
                style={{
                  cursor: canNavigate
                    ? "pointer"
                    : "not-allowed",
                  opacity: canNavigate
                    ? 1
                    : 0.55,
                }}
              >
                <div className="timeline">
                  <div
                    className={`circle ${
                      completed
                        ? "completed"
                        : active
                        ? "active"
                        : ""
                    }`}
                  >
                    {completed
                      ? "✓"
                      : stepNumber}
                  </div>

                  {index <
                    steps.length - 1 && (
                    <div className="line"></div>
                  )}
                </div>

                <div className="step-text">
                  <div className="title">
                    {step.title}
                  </div>

                  <div className="subtitle">
                    {step.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="footer">
        <div>Secure setup</div>

        <small>
          SOC 2 • encrypted at rest
        </small>
      </div>
    </div>
  );
}

export default OnboardingSidebar;