const CACHE_NAME = 'mind-diary-v1';
const APP_SHELL = [
  '/',
  '/index.html',
];

// Friendly reminder messages that rotate
const REMINDER_MESSAGES = [
  { title: 'Mind Diary', body: 'Час записати думки ✨' },
  { title: 'Mind Diary', body: 'Як пройшов твій день? Запиши кілька слів.' },
  { title: 'Mind Diary', body: 'Хвилинка для себе — напиши щось у щоденник.' },
  { title: 'Mind Diary', body: 'Твій щоденник чекає. Навіть кілька слів мають значення.' },
  { title: 'Mind Diary', body: 'Зупинись на хвилину — як ти себе почуваєш?' },
];

let reminderTime = null;
let checkInterval = null;

// --- IndexedDB helpers (raw API, no idb library) ---

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mind-diary-sw', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getFromDB(key) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const store = tx.objectStore('meta');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function putInDB(key, value) {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

// --- Reminder logic ---

function getTodayDateStr() {
  const now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
}

function getCurrentTimeStr() {
  const now = new Date();
  return String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
}

async function checkAndFireReminder() {
  if (!reminderTime) return;

  const currentTime = getCurrentTimeStr();
  if (currentTime !== reminderTime) return;

  const today = getTodayDateStr();
  const lastSent = await getFromDB('lastSentDate').catch(() => null);

  if (lastSent === today) return;

  // Pick a message from the rotating pool
  const messageIndex = Math.floor(Math.random() * REMINDER_MESSAGES.length);
  const message = REMINDER_MESSAGES[messageIndex];

  await self.registration.showNotification(message.title, {
    body: message.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'mind-diary-reminder',
  });

  await putInDB('lastSentDate', today);
}

function startReminderCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  // Check every 60 seconds
  checkInterval = setInterval(checkAndFireReminder, 60 * 1000);
  // Also check immediately
  checkAndFireReminder();
}

// --- Service Worker events ---

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();

  // Restore saved reminder time on activation
  getFromDB('reminderTime').then((savedTime) => {
    if (savedTime) {
      reminderTime = savedTime;
      startReminderCheck();
    }
  }).catch(() => {});
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    reminderTime = event.data.time;
    putInDB('reminderTime', reminderTime).catch(() => {});
    startReminderCheck();
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If an app window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window to the home page
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        event.waitUntil(
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
