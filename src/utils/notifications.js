export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export function scheduleReminder(timeStr) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.active.postMessage({
        type: 'SCHEDULE_REMINDER',
        time: timeStr,
      });
    });
  }
}
