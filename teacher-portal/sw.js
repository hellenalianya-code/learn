// LearnReach teacher portal: offline helper.
// Opens the portal from this device at once (also with no internet) and fetches any new version in the background.
// When a new version has been saved, open pages are told so they can offer "Refresh".
// Live data (Supabase) is never cached here.
const CACHE = 'learnreach-portal-v1';
const PAGE = new URL('index.html', self.registration.scope).href;
const CONFIG = new URL('../supabase-config.js', self.registration.scope).href;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([PAGE, CONFIG]).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('learnreach-portal-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

let updated = false; // a newer page was saved while an older one was showing
async function tellPages() {
  updated = true;
  const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  cs.forEach((c) => c.postMessage({ type: 'lr-update' }));
}
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'lr-check' && updated && e.source) e.source.postMessage({ type: 'lr-update' }); });

// The page and its settings: answer from the device, then refresh the saved copy in the background.
async function fromDeviceThenUpdate(e, url, isPage) {
  if (isPage) updated = false; // this page gets the newest saved copy
  const c = await caches.open(CACHE);
  const saved = await c.match(url);
  const before = saved ? saved.clone() : null; // the page reads "saved"; compare with this copy
  const fresh = fetch(url, { cache: 'no-cache' }).then(async (res) => {
    if (res && res.ok) {
      if (isPage && before) {
        const [a, b] = await Promise.all([before.text(), res.clone().text()]);
        await c.put(url, res.clone());
        if (a !== b) tellPages();
      } else await c.put(url, res.clone());
    }
    return res;
  }).catch(() => null);
  if (saved) { e.waitUntil(fresh); return saved; }
  const res = await fresh;
  return res || new Response('<h1>LearnReach</h1><p>No internet, and this page has not been saved on this device yet.</p>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// Fonts and the sign-in library: keep a copy after the first use.
async function keepCopy(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (/supabase\.co$/.test(u.hostname)) return; // live data: always from the network
  const scope = new URL(self.registration.scope);
  const isPage = req.mode === 'navigate' && u.origin === scope.origin && u.pathname.startsWith(scope.pathname);
  if (isPage || (u.origin === scope.origin && u.pathname === scope.pathname + 'index.html')) { e.respondWith(fromDeviceThenUpdate(e, PAGE, true)); return; }
  if (u.href.split('?')[0] === CONFIG) { e.respondWith(fromDeviceThenUpdate(e, CONFIG, false)); return; }
  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/.test(u.hostname)) { e.respondWith(keepCopy(req)); }
});
