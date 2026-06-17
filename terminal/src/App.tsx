import { useState } from "react";
import Onboarding from "./Onboarding";

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  if (!onboardingComplete) {
    return <Onboarding />;
  }

  // TODO: Replace with Terminal component once onboarding is complete
  return (
    <div style={{ color: "white", padding: "20px" }}>
      <p>Terminal interface coming soon!</p>
      <p>Onboarding complete! 🎉</p>
    </div>
  );
}
