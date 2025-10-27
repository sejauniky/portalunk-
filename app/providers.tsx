"use client";

import { useEffect } from "react";

// Lista de mensagens de erro para suprimir
const SUPPRESSED_ERROR_MESSAGES = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications.",
  "Cannot read properties of null (reading 'postMessage')",
];

// Suprime erros de evento global
const suppressError = (event: ErrorEvent) => {
  if (
    event?.message &&
    SUPPRESSED_ERROR_MESSAGES.some((msg) => event.message.includes(msg))
  ) {
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

  if (
    message &&
    SUPPRESSED_ERROR_MESSAGES.some((msg) => message.includes(msg))
  ) {
    event.preventDefault();
  }
};

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle RSC payload fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
        if (url && typeof url === 'string' && (url.includes('_next/rsc') || url.includes('_rsc'))) {
          console.warn('[RSC Fetch Error]', { url, error });
        }
        throw error;
      }
    };

    // Add error listeners
    window.addEventListener("error", suppressError);
    window.addEventListener("unhandledrejection", suppressRejection);

    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log(
              "✅ Service Worker registrado com sucesso:",
              registration.scope
            );
          })
          .catch((error) => {
            console.log("❌ Falha ao registrar Service Worker:", error);
          });
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener("error", suppressError);
      window.removeEventListener("unhandledrejection", suppressRejection);
    };
  }, []);

  return children;
}
