import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const suppressedErrorMessages = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications.",
  "Cannot read properties of null (reading 'postMessage')",
];

const suppressError = (event: ErrorEvent) => {
  if (event?.message && suppressedErrorMessages.some((message) => event.message.includes(message))) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
};

const suppressRejection = (event: PromiseRejectionEvent) => {
  const reason = event?.reason;
  const message =
    typeof reason === "string"
      ? reason
      : typeof reason?.message === "string"
        ? reason.message
        : null;
  if (message && suppressedErrorMessages.some((target) => message.includes(target))) {
    event.preventDefault();
  }
};

window.addEventListener("error", suppressError);
window.addEventListener("unhandledrejection", suppressRejection);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registrado com sucesso:', registration.scope);
      })
      .catch(error => {
        console.log('❌ Falha ao registrar Service Worker:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
