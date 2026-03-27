import { openDB } from 'idb';

const DB_NAME = 'mind-diary';
const DB_VERSION = 5;

function genId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
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
      if (oldVersion < 4) {
        const fragments = tx.objectStore('fragments');
        fragments.createIndex('sourceReflectionId', 'sourceReflectionId', { unique: false });
      }
      if (oldVersion < 5) {
        const nodesStore = db.createObjectStore('nodes', { keyPath: 'id' });
        nodesStore.createIndex('level', 'level', { unique: false });
        nodesStore.createIndex('createdAt', 'createdAt', { unique: false });
        nodesStore.createIndex('lastInteractedAt', 'lastInteractedAt', { unique: false });
      }
    },
  });
}

// Run migration from old stores (fragments/reflections) to nodes.
// Called once on app startup after DB is opened.
export async function migrateToNodes() {
  const db = await getDB();

  // Check if migration already happened (nodes store has data)
  const existingCount = await db.count('nodes');
  if (existingCount > 0) return false;

  // Check if old stores have data to migrate
  const hasFragments = db.objectStoreNames.contains('fragments');
  const hasReflections = db.objectStoreNames.contains('reflections');

  if (!hasFragments && !hasReflections) return false;

  const oldFragments = hasFragments ? await db.getAll('fragments') : [];
  const oldReflections = hasReflections ? await db.getAll('reflections') : [];

  if (oldFragments.length === 0 && oldReflections.length === 0) return false;

  const nodes = [];

  // Convert fragments -> atoms
  for (const frag of oldFragments) {
    nodes.push({
      id: frag.id,
      level: 'atom',
      type: frag.type,
      content: frag.content,
      childIds: [],
      note: null,
      createdAt: frag.createdAt,
    });
  }

  // Convert reflections -> molecules
  for (const ref of oldReflections) {
    const childIds = (ref.fragmentIds || []).filter(id =>
      oldFragments.some(f => f.id === id)
    );

    const molecule = {
      id: ref.id,
      level: 'molecule',
      type: null,
      content: null,
      childIds,
      note: ref.text || null,
      createdAt: ref.createdAt,
    };
    nodes.push(molecule);
  }

  // Write all nodes in a single transaction
  const tx = db.transaction('nodes', 'readwrite');
  for (const node of nodes) {
    tx.store.put(node);
  }
  await tx.done;

  return true;
}

// --- Node CRUD ---

export async function getAllNodes() {
  const db = await getDB();
  return db.getAll('nodes');
}

export async function saveNode(node) {
  const db = await getDB();
  await db.put('nodes', node);
}

export async function saveNodes(nodes) {
  const db = await getDB();
  const tx = db.transaction('nodes', 'readwrite');
  for (const node of nodes) {
    tx.store.put(node);
  }
  await tx.done;
}

export async function deleteNode(id) {
  const db = await getDB();
  await db.delete('nodes', id);
}

export async function clearAllNodes() {
  const db = await getDB();
  const tx = db.transaction('nodes', 'readwrite');
  await tx.store.clear();
  await tx.done;
}
