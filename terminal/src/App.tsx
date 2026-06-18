import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import Onboarding from "./Onboarding";
import Terminal from "./Terminal";

type Screen = "landing" | "onboarding" | "terminal";
type AuthMode = "signin" | "signup";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

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

  const handleOnboardingComplete = () => {
    localStorage.setItem("elliot_onboarded", "true");
    setScreen("terminal");
  };

  return (
    <>
      {screen === "landing" && (
        <LandingPage
          authMode={authMode}
          setAuthMode={setAuthMode}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />
      )}
      {screen === "onboarding" && <Onboarding onComplete={handleOnboardingComplete} />}
      {screen === "terminal" && (
        <Terminal onReset={() => { localStorage.removeItem("elliot_onboarded"); setScreen("landing"); }} />
      )}
    </>
  );
}
