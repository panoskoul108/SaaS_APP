import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import posthog from 'posthog-js';

// Αρχικοποίηση PostHog (Αντικατέστησε το phc_... με το δικό σου Project Token)
posthog.init('phc_9YTi2wzVND4e7IlCLHkbmHFwDT9pHfI1lTb4R2n4hXT', {
  api_host: 'https://eu.i.posthog.com',
  autocapture: true, 
  capture_pageview: true, 
});

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Ενεργοποίηση του Service Worker για να γίνει η εφαρμογή εγκαταστάσιμη (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
