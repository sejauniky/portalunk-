self.addEventListener("install", (event) => {
  console.log("✅ Service Worker instalado.");
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker ativado.");
});

self.addEventListener("fetch", (event) => {
  // Aqui você pode implementar cache se quiser
});
