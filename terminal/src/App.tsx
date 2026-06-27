import { useState, useEffect } from "react";
import LandingPage from "./LandingPage";
import Onboarding from "./Onboarding";
import Terminal from "./Terminal";

type Screen = "landing" | "onboarding" | "terminal";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  useEffect(() => {
    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        try {
          const response = await fetch(
            `${window.location.origin}/auth/callback?token=${token}`
          );
          const data = await response.json();

          if (data.access_token && data.email) {
            localStorage.setItem("jwt", data.access_token);
            localStorage.setItem("email", data.email);
            localStorage.setItem("expires_in_seconds", data.expires_in_seconds);
            setScreen("onboarding");
            window.history.replaceState({}, document.title, "/");
          }
        } catch (error) {
          console.error("Auth callback failed:", error);
          setScreen("landing");
        }
        return;
      }

      if (localStorage.getItem("elliot_onboarded") === "true") {
        setScreen("terminal");
      }
    };

    handleAuthCallback();
  }, []);

  const handleSignUp = () => {
    setScreen("onboarding");
  };

  return (
    <>
      {screen === "landing" && <LandingPage onSignUp={handleSignUp} />}
      {screen === "onboarding" && <Onboarding />}
      {screen === "terminal" && (
        <Terminal onReset={() => { localStorage.removeItem("elliot_onboarded"); setScreen("landing"); }} />
      )}
    </>
  );
}
