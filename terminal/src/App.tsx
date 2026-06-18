import { useState } from "react";
import LandingPage from "./LandingPage";
import Onboarding from "./Onboarding";
import Terminal from "./Terminal";

type Screen = "landing" | "onboarding" | "terminal";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  return (
    <>
      {screen === "landing" && <LandingPage onSignIn={() => setScreen("onboarding")} />}
      {screen === "onboarding" && <Onboarding onComplete={() => setScreen("terminal")} />}
      {screen === "terminal" && <Terminal />}
    </>
  );
}
