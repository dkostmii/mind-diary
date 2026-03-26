import { create } from 'zustand';
import { getAllNodes, saveNode, saveNodes, deleteNode, clearAllNodes } from '../utils/storage';
import { refreshNode, getDecay, computeBaseHalfLife, DISSOLVE_THRESHOLD } from '../engine/decay';

function genId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const useNodeStore = create((set, get) => ({
  nodes: [],
  loaded: false,

  loadNodes: async () => {
    const nodes = await getAllNodes();
    set({ nodes, loaded: true });
  },

  addNodes: async (newNodes) => {
    await saveNodes(newNodes);
    set({ nodes: [...get().nodes, ...newNodes] });
  },

  removeNode: async (id) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);

    await deleteNode(id);

    // If atom, remove from all parents' childIds
    if (node && node.level === 'atom') {
      const parents = nodes.filter(n => n.childIds.includes(id));
      for (const parent of parents) {
        const updated = { ...parent, childIds: parent.childIds.filter(cid => cid !== id) };
        await saveNode(updated);
      }
      set({
        nodes: nodes
          .filter(n => n.id !== id)
          .map(n => n.childIds.includes(id)
            ? { ...n, childIds: n.childIds.filter(cid => cid !== id) }
            : n
          ),
      });
    } else {
      // Removing a molecule/story does NOT remove children
      set({ nodes: nodes.filter(n => n.id !== id) });
    }
  },

  updateNode: async (id, updates) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const updated = { ...node, ...updates };
    await saveNode(updated);
    set({ nodes: nodes.map(n => n.id === id ? updated : n) });
  },

  refreshNodeDecay: async (id) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    // Refresh the node itself
    const refreshed = refreshNode(node);
    const toSave = [refreshed];

    // If it's a molecule/story, also refresh its children
    const refreshedChildren = [];
    if (node.childIds.length > 0) {
      for (const cid of node.childIds) {
        const child = nodes.find(n => n.id === cid);
        if (child) {
          const rc = refreshNode(child);
          refreshedChildren.push(rc);
          toSave.push(rc);
        }
      }
    }

    await saveNodes(toSave);
    const refreshedMap = new Map(toSave.map(n => [n.id, n]));
    set({ nodes: nodes.map(n => refreshedMap.get(n.id) || n) });
  },

  combineNodes: async (childIds, note = null, attachments = []) => {
    const nodes = get().nodes;
    const selected = nodes.filter(n => childIds.includes(n.id));
    if (selected.length < 2) return null;

    // Flatten: if any selected node is a molecule/story, pull its atom children
    // and mark the old parent for removal
    const flatAtomIds = [];
    const allTouched = []; // atom nodes to refresh
    const consumedIds = []; // molecule/story ids to remove after merge
    for (const node of selected) {
      if (node.level === 'molecule' || node.level === 'story') {
        for (const cid of node.childIds) {
          if (!flatAtomIds.includes(cid)) flatAtomIds.push(cid);
        }
        const atomChildren = nodes.filter(n => node.childIds.includes(n.id));
        allTouched.push(...atomChildren);
        consumedIds.push(node.id);
      } else {
        if (!flatAtomIds.includes(node.id)) flatAtomIds.push(node.id);
        allTouched.push(node);
      }
    }

    const now = Date.now();
    const base = { level: 'atom', childIds: [], note: null,
                   createdAt: now, lastInteractedAt: now, interactionCount: 1 };
    const allChildIds = [...flatAtomIds];
    const extraAtoms = [];

    // If note provided, create a text atom for it and include as child
    if (note && note.trim()) {
      const noteAtom = { ...base, id: genId(), type: 'text',
                         content: { excerpt: note.trim() } };
      extraAtoms.push(noteAtom);
      allChildIds.push(noteAtom.id);
    }

    // Create atoms from attachments (same types the composer supports)
    for (const att of attachments) {
      let content;
      switch (att.type) {
        case 'photo':    content = { data: att.data }; break;
        case 'location': content = { name: att.name || '', lat: att.lat, lng: att.lng }; break;
        case 'music':    content = { title: att.title, artist: att.artist, url: att.url }; break;
        case 'video':    content = { thumbnailUrl: att.thumbnailUrl, url: att.url }; break;
        case 'link':     content = { url: att.url, title: att.title || '' }; break;
        default: continue;
      }
      const atom = { ...base, id: genId(), type: att.type, content };
      extraAtoms.push(atom);
      allChildIds.push(atom.id);
    }

    // Always produce a molecule — flat box of atoms
    const newNode = {
      id: genId(),
      level: 'molecule',
      type: null,
      content: null,
      childIds: allChildIds,
      note: null,
      createdAt: now,
      lastInteractedAt: now,
      interactionCount: 1,
    };

    // Refresh all touched nodes (deduplicate)
    const seenIds = new Set();
    const uniqueTouched = allTouched.filter(n => {
      if (seenIds.has(n.id)) return false;
      seenIds.add(n.id);
      return true;
    });
    const refreshedNodes = uniqueTouched.map(c => refreshNode(c));
    const nodesToSave = [...refreshedNodes, newNode, ...extraAtoms];

    // Delete consumed molecules/stories from DB, then save new/refreshed nodes
    for (const id of consumedIds) {
      await deleteNode(id);
    }
    await saveNodes(nodesToSave);

    const consumedSet = new Set(consumedIds);
    const updatedNodes = get().nodes
      .filter(n => !consumedSet.has(n.id))
      .map(n => {
        const refreshed = refreshedNodes.find(r => r.id === n.id);
        return refreshed || n;
      });

    set({ nodes: [...updatedNodes, newNode, ...extraAtoms] });
    return newNode;
  },

  addChildrenToNode: async (parentId, newChildIds) => {
    const nodes = get().nodes;
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const updatedChildIds = [...new Set([...parent.childIds, ...newChildIds])];
    const refreshedParent = {
      ...refreshNode(parent),
      childIds: updatedChildIds,
    };

    // Refresh added children too
    const addedChildren = nodes.filter(n => newChildIds.includes(n.id));
    const refreshedChildren = addedChildren.map(c => refreshNode(c));

    const nodesToSave = [refreshedParent, ...refreshedChildren];
    await saveNodes(nodesToSave);

    set({
      nodes: nodes.map(n => {
        if (n.id === parentId) return refreshedParent;
        const refreshed = refreshedChildren.find(r => r.id === n.id);
        return refreshed || n;
      }),
    });
  },

  importNodes: async (importedNodes) => {
    const existing = get().nodes;
    const existingIds = new Set(existing.map(n => n.id));
    const toAdd = importedNodes.filter(n => !existingIds.has(n.id));
    if (toAdd.length === 0) return 0;

    await saveNodes(toAdd);
    set({ nodes: [...existing, ...toAdd] });
    return toAdd.length;
  },

  clearAndImportNodes: async (importedNodes) => {
    await clearAllNodes();
    await saveNodes(importedNodes);
    set({ nodes: importedNodes });
    return importedNodes.length;
  },

}));

// Event-driven dissolution: whenever the store changes, check if any
// molecules/stories have fully faded and dissolve them automatically.
let dissolving = false;
useNodeStore.subscribe(async (state) => {
  if (dissolving) return;
  const { nodes } = state;
  const baseHalfLife = computeBaseHalfLife(nodes);
  const toDissolve = nodes.filter(
    n => (n.level === 'molecule' || n.level === 'story') &&
         getDecay(n, baseHalfLife).retention <= DISSOLVE_THRESHOLD
  );
  if (toDissolve.length === 0) return;

  dissolving = true;
  try {
    for (const node of toDissolve) {
      await deleteNode(node.id);
    }
    const dissolvedIds = new Set(toDissolve.map(n => n.id));
    useNodeStore.setState({
      nodes: useNodeStore.getState().nodes.filter(n => !dissolvedIds.has(n.id)),
    });
  } finally {
    dissolving = false;
  }
});

export default useNodeStore;
