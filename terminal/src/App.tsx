import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import Onboarding from "./Onboarding";
import Terminal from "./Terminal";

type Screen = "landing" | "onboarding" | "terminal";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  useEffect(() => {
    if (localStorage.getItem("elliot_onboarded") === "true") {
      setScreen("terminal");
    }
  }, []);

  const handleSignIn = () => {
    setScreen("terminal");
  };

  const handleSignUp = () => {
    setScreen("onboarding");
  };

  return (
    <>
      {screen === "landing" && <LandingPage onSignIn={handleSignIn} onSignUp={handleSignUp} />}
      {screen === "onboarding" && <Onboarding />}
      {screen === "terminal" && (
        <Terminal onReset={() => { localStorage.removeItem("elliot_onboarded"); setScreen("landing"); }} />
      )}
    </>
  );
}
