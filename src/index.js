import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import posthog from 'posthog-js';

// Αρχικοποίηση PostHog
posthog.init('phc_ΒΑΛΕ_ΤΟ_ΔΙΚΟ_ΣΟΥ_TOKEN_ΕΔΩ', {
  api_host: 'https://eu.i.posthog.com',
  autocapture: true, 
  capture_pageview: true, 
  opt_out_capturing_by_default: true // Η προσθήκη για τον νόμο GDPR
});

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Ενεργοποίηση του Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
