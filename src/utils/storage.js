import { openDB } from 'idb';

const DB_NAME = 'mind-diary';
const DB_VERSION = 2;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains('entries')) {
          db.deleteObjectStore('entries');
        }
        const store = db.createObjectStore('messages', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    },
  });
}

export async function getAllMessages() {
  const db = await getDB();
  return db.getAll('messages');
}

export async function saveMessage(message) {
  const db = await getDB();
  await db.put('messages', message);
}

export async function deleteMessage(id) {
  const db = await getDB();
  await db.delete('messages', id);
}
