import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ConnectorCallbackPage from "./ConnectorCallbackPage";
import "./App.css";

// If the browser landed on /connectors/callback, render the lightweight
// callback handler instead of the full app.
const root = document.getElementById("root")!;

if (window.location.pathname === "/connectors/callback") {
  createRoot(root).render(<ConnectorCallbackPage />);
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
