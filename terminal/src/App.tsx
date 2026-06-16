import { useState } from "react";

import LaunchScreen from "./LaunchScreen";
import Terminal from "./Terminal";

/**
 * Top-level route gate.
 *
 * Until the user clicks "Launch Elliot terminal" on LaunchScreen we render
 * that. After they click, we mount the main Terminal view.
 *
 * Backend `/launch` endpoint is task #27 (Astika); until it lands, we run
 * with `useMock={true}` so the UI works in isolation. Set
 * `VITE_API_BASE=https://...` to switch to the real fetch.
 */
const USE_MOCK = !import.meta.env.VITE_API_BASE;

export default function App() {
  const [launched, setLaunched] = useState(false);
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("elliot_token") ?? undefined
      : undefined;

  if (!launched) {
    return (
      <LaunchScreen
        token={token}
        useMock={USE_MOCK}
        onLaunch={() => setLaunched(true)}
      />
    );
  }

  return <Terminal />;
}
