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
      const jwt = params.get("jwt");
      const step = params.get("step");

      // OAuth callback (Google, Entra, etc.)
      if (jwt && step) {
        localStorage.setItem("jwt", jwt);
        setScreen("onboarding");
        return;
      }

      // Magic link callback
      if (token) {
        try {
          const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
          const response = await fetch(
            `${API_URL}/auth/callback?token=${token}`
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
