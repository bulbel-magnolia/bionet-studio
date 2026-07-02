import React from "react";
import { createRoot } from "react-dom/client";

import "./legacy/tokens.css";
import "./legacy/components.css";
import "./legacy/premium.css";

declare global {
  interface Window {
    React: typeof React;
  }
}

window.React = React;
(window as any).ReactDOM = { createRoot };

async function boot() {
  // Legacy browser scripts attach their exports to window; the staged imports
  // preserve the old load order while Vite bundles them as static assets.
  // @ts-ignore TS2306: legacy script intentionally has no module exports.
  await import("./legacy/i18n.js");
  // @ts-ignore TS2306: legacy script intentionally has no module exports.
  await import("./legacy/sim.js");
  // @ts-ignore TS2306: legacy script intentionally has no module exports.
  await import("./legacy/model.js");
  // @ts-ignore TS2306: legacy script intentionally has no module exports.
  await import("./legacy/runs.js");
  await import("./legacy/tweaks-panel.jsx");
  await import("./legacy/icons.jsx");
  await import("./legacy/charts.jsx");
  await import("./legacy/canvas.jsx");
  await import("./legacy/inspector.jsx");
  await import("./legacy/readouts.jsx");
  await import("./legacy/chrome.jsx");
  await import("./legacy/library.jsx");
  await import("./legacy/compare.jsx");
  await import("./legacy/runs-page.jsx");
  await import("./legacy/app.jsx");
}

void boot();
