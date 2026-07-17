import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { initClarity } from "./lib/clarity.js";
import "./index.css";

// Behavior heatmaps + session recordings (no-op unless VITE_CLARITY_ID is set).
initClarity();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
