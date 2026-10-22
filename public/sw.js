// Service worker minimal — tujuannya cuma biar app ini memenuhi syarat "installable" PWA
// (Chrome/Edge/Android butuh ada SW aktif dengan fetch handler). SENGAJA TIDAK cache data
// (nilai, rapor, dsb) karena data itu harus selalu fresh dari server, dan nge-cache halaman
// yang butuh login bisa bocor ke sesi berikutnya di perangkat yang sama. Cuma file statis
// (JS/CSS/gambar/font dari _next/static) yang di-cache-first biar app kerasa lebih cepat
// pas dibuka ulang.
const CACHE = "rapor-unggulan-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const asetStatis = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/pwa/");
  if (!asetStatis) return; // biarkan semua request lain (halaman, API, data) langsung ke network

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const tersimpan = await cache.match(request);
      if (tersimpan) return tersimpan;
      const respons = await fetch(request);
      if (respons.ok) cache.put(request, respons.clone());
      return respons;
    }),
  );
});
