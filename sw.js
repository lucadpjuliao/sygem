// SyGEM · Service worker
// Mantém o app instalável e abre a última versão salva quando estiver sem internet.
// Os dados continuam vindo do banco online (Supabase); nada do banco é guardado aqui.
const CACHE = "sygem-v1";
const ARQUIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // banco, fontes e bibliotecas: sempre pela rede

  // Páginas: sempre busca a versão mais nova; sem internet, usa a última salva.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put("./index.html", c)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Ícones e demais arquivos do app: rede primeiro, cópia salva como reserva.
  e.respondWith(
    fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return r; })
      .catch(() => caches.match(req))
  );
});
