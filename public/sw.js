// Service Worker minimal — active la PWA installable
// Pas de cache agressif (données financières = toujours fraîches)

const CACHE_NAME = "facturnow-v1"

// Installation : active immédiatement sans attendre l'ancienne SW
self.addEventListener("install", () => self.skipWaiting())

// Activation : prend le contrôle de tous les onglets ouverts
self.addEventListener("activate", (event) => {
  event.waitUntil(
    // Nettoyage des anciens caches à chaque mise à jour
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch : stratégie "network first" — toujours chercher sur le réseau
// En cas d'offline, on laisse le navigateur gérer (pas de fallback offline ici)
self.addEventListener("fetch", (event) => {
  // Ne pas intercepter les requêtes non-GET, les API calls ni les navigations de page
  // (données financières = toujours fraîches, pas de cache sur les pages)
  if (event.request.method !== "GET") return
  if (event.request.url.includes("/api/")) return
  if (event.request.mode === "navigate") return

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached ?? new Response("Offline", { status: 503 }))
    )
  )
})
