import { openDB } from 'idb';

const DB_NAME = 'mind-diary';
const DB_VERSION = 3;

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
      if (oldVersion < 3) {
        const fragments = db.createObjectStore('fragments', { keyPath: 'id' });
        fragments.createIndex('sourceMessageId', 'sourceMessageId', { unique: false });
        fragments.createIndex('createdAt', 'createdAt', { unique: false });

        const reflections = db.createObjectStore('reflections', { keyPath: 'id' });
        reflections.createIndex('createdAt', 'createdAt', { unique: false });
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

export async function getAllFragments() {
  const db = await getDB();
  return db.getAll('fragments');
}

export async function saveFragment(fragment) {
  const db = await getDB();
  await db.put('fragments', fragment);
}

export async function deleteFragmentsByMessageId(messageId) {
  const db = await getDB();
  const tx = db.transaction('fragments', 'readwrite');
  const index = tx.store.index('sourceMessageId');
  let cursor = await index.openCursor(messageId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function getAllReflections() {
  const db = await getDB();
  return db.getAll('reflections');
}

export async function saveReflection(reflection) {
  const db = await getDB();
  await db.put('reflections', reflection);
}

export async function deleteReflection(id) {
  const db = await getDB();
  await db.delete('reflections', id);
}
