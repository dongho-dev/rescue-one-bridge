const CACHE_NAME = 'r1b-v2';
const PRECACHE_URLS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Never cache API responses — may contain patient data (PHI)
  if (
    url.includes('supabase.co') ||
    url.includes('/rest/') ||
    url.includes('/auth/') ||
    url.includes('/realtime/') ||
    url.includes('nominatim.openstreetmap.org')
  ) {
    return;
  }

  // Cache static assets only (network-first)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// 푸시 알림 수신 (Web Push / FCM 연동 시 동작)
self.addEventListener('push', (event) => {
  const defaultData = {
    title: '새 환자 이송 요청',
    body: '새로운 요청이 도착했습니다',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'r1b-push',
  };

  let data = defaultData;
  if (event.data) {
    try {
      data = { ...defaultData, ...event.data.json() };
    } catch {
      data = { ...defaultData, body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })
  );
});

// 알림 클릭 시 앱으로 포커스
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
