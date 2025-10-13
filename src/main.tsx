import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Lista de mensagens de erro para suprimir
const suppressedErrorMessages = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications.",
  "Cannot read properties of null (reading 'postMessage')",
];

// Suprime erros de evento global
const suppressError = (event: ErrorEvent) => {
  if (event?.message && suppressedErrorMessages.some((msg) => event.message.includes(msg))) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
};

// Suprime erros de promessas não tratadas
const suppressRejection = (event: PromiseRejectionEvent) => {
  const reason = event?.reason;
  const message =
    typeof reason === "string"
      ? reason
      : typeof reason?.message === "string"
        ? reason.message
        : null;

  if (message && suppressedErrorMessages.some((msg) => message.includes(msg))) {
    event.preventDefault();
  }
};

window.addEventListener("error", suppressError);
window.addEventListener("unhandledrejection", suppressRejection);

// Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ Service Worker registrado com sucesso:", registration.scope);
      })
      .catch((error) => {
        console.log("❌ Falha ao registrar Service Worker:", error);
      });
  });
}

// Renderização segura do React
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("❌ Elemento #root não encontrado no DOM.");
}
