import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Serve index.html for all routes so /connectors/callback works
    historyApiFallback: true,
  },
});
