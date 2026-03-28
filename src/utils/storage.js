import { openDB } from 'idb';

const DB_NAME = 'mind-diary-chat';
const DB_VERSION = 1;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
}

export async function getAllMessages() {
  const db = await getDB();
  return db.getAll('messages');
}

export async function saveMessage(msg) {
  const db = await getDB();
  await db.put('messages', msg);
}

export async function saveMessages(msgs) {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  for (const msg of msgs) {
    tx.store.put(msg);
  }
  await tx.done;
}

export async function deleteMessage(id) {
  const db = await getDB();
  await db.delete('messages', id);
}

export async function deleteMessages(ids) {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  for (const id of ids) {
    tx.store.delete(id);
  }
  await tx.done;
}

export async function clearAllMessages() {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
