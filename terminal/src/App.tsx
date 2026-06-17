import { useState } from "react";
import Onboarding from "./Onboarding";
import Terminal from "./Terminal";

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);

  return isOnboarded ? <Terminal /> : <Onboarding onComplete={() => setIsOnboarded(true)} />;
}
