import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);

// canonical-domain guard
const CANON = "log-in-stocking-googlesheet.vercel.app";
if (location.hostname.endsWith("-godsafe1s-projects.vercel.app")) {
  const target = `https://${CANON}${location.pathname}${location.search}${location.hash}`;
  location.replace(target);
}