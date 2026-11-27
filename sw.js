/* 给雁茹的圣诞树 — 离线缓存：第二次打开秒开，断网也能看 */
const CACHE = 'yanru-tree-v3';
const CORE = [
  './',
  './index.html',
  './assets/index-CZPyPNXc.js',
  './assets/index-BeE7YxDE.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;
  if (req.headers.has('range')) return; // 音乐流媒体走原生请求，不拦

  // 页面导航：网络优先，保证拿到最新版；断网时回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return r;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 静态资源：缓存优先，首次访问顺手存下（音乐除外，体积大且走流媒体）
  if (req.url.includes('/audio/')) return;
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((r) => {
          if (r.ok) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return r;
        })
    )
  );
});
