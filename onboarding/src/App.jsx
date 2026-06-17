import { useState } from "react";
import OnboardingSidebar from "./components/OnboardingSidebar";
import "./App.css";

function App() {
  const [currentStep, setCurrentStep] = useState(1);

  const pageTitles = {
    1: "Sign In Page",
    2: "Workspace Page",
    3: "SDLC Profile Page",
    4: "Connect Sources Page",
    5: "Index Knowledge Page",
    6: "Launch Page",
  };

  return (
    <div className="app-container">
      <OnboardingSidebar
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />

      <div className="page-content">
        <h1>{pageTitles[currentStep]}</h1>

        <p>
          This is where the content for step {currentStep} goes.
        </p>

        <div className="button-row">
          <button
            onClick={() =>
              setCurrentStep(Math.max(1, currentStep - 1))
            }
          >
            Previous
          </button>

          <button
            onClick={() =>
              setCurrentStep(Math.min(6, currentStep + 1))
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;