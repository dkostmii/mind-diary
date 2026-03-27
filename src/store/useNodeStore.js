import { create } from 'zustand';
import { getAllNodes, saveNode, saveNodes, deleteNode, clearAllNodes } from '../utils/storage';
import { getDecay, computeBaseHalfLife, DISSOLVE_THRESHOLD, recordComposerOperation } from '../engine/decay';

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

  addNodes: async (newNodes, { fromComposer = false } = {}) => {
    await saveNodes(newNodes);
    if (fromComposer) recordComposerOperation();
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
      // Removing a molecule does NOT remove children
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

  // Stamp createdAt to now on a node and its children (used by composer actions).
  refreshCreatedAt: async (id) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const now = Date.now();
    const stamped = { ...node, createdAt: now };
    const toSave = [stamped];

    if (node.childIds.length > 0) {
      for (const cid of node.childIds) {
        const child = nodes.find(n => n.id === cid);
        if (child) {
          toSave.push({ ...child, createdAt: now });
        }
      }
    }

    await saveNodes(toSave);
    const stampedMap = new Map(toSave.map(n => [n.id, n]));
    set({ nodes: nodes.map(n => stampedMap.get(n.id) || n) });
  },

  combineNodes: async (childIds, note = null, attachments = []) => {
    const nodes = get().nodes;
    const selected = nodes.filter(n => childIds.includes(n.id));
    if (selected.length < 2) return null;

    // Flatten: if any selected node is a molecule, pull its atom children
    // and mark the old parent for removal
    const flatAtomIds = [];
    const consumedIds = []; // molecule ids to remove after merge
    for (const node of selected) {
      if (node.level === 'molecule') {
        for (const cid of node.childIds) {
          if (!flatAtomIds.includes(cid)) flatAtomIds.push(cid);
        }
        consumedIds.push(node.id);
      } else {
        if (!flatAtomIds.includes(node.id)) flatAtomIds.push(node.id);
      }
    }

    const now = Date.now();
    const base = { level: 'atom', childIds: [], note: null, createdAt: now };
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

    const newNode = {
      id: genId(),
      level: 'molecule',
      type: null,
      content: null,
      childIds: allChildIds,
      note: null,
      createdAt: now,
    };

    // Stamp createdAt on all existing child atoms (they were "used" in composer)
    const stampedAtoms = [];
    for (const aid of flatAtomIds) {
      const atom = nodes.find(n => n.id === aid);
      if (atom) stampedAtoms.push({ ...atom, createdAt: now });
    }

    const nodesToSave = [...stampedAtoms, newNode, ...extraAtoms];

    for (const id of consumedIds) {
      await deleteNode(id);
    }
    await saveNodes(nodesToSave);
    recordComposerOperation();

    const consumedSet = new Set(consumedIds);
    const stampedMap = new Map(stampedAtoms.map(n => [n.id, n]));
    const updatedNodes = get().nodes
      .filter(n => !consumedSet.has(n.id))
      .map(n => stampedMap.get(n.id) || n);

    set({ nodes: [...updatedNodes, newNode, ...extraAtoms] });
    return newNode;
  },

  addChildrenToNode: async (parentId, newChildIds) => {
    const nodes = get().nodes;
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const now = Date.now();
    const updatedChildIds = [...new Set([...parent.childIds, ...newChildIds])];
    const stampedParent = { ...parent, childIds: updatedChildIds, createdAt: now };

    // Stamp createdAt on added children (they were "used" in composer)
    const addedChildren = nodes.filter(n => newChildIds.includes(n.id));
    const stampedChildren = addedChildren.map(c => ({ ...c, createdAt: now }));

    const nodesToSave = [stampedParent, ...stampedChildren];
    await saveNodes(nodesToSave);
    recordComposerOperation();

    set({
      nodes: nodes.map(n => {
        if (n.id === parentId) return stampedParent;
        const stamped = stampedChildren.find(s => s.id === n.id);
        return stamped || n;
      }),
    });
  },

  // Dissolve a molecule: delete it, stamp its child atoms sharp.
  dissolveMolecule: async (id) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);
    if (!node || node.level !== 'molecule') return;

    const now = Date.now();
    await deleteNode(id);

    // Stamp child atoms sharp so user can recombine them
    const childIds = new Set(node.childIds);
    const toSave = [];
    const updated = nodes
      .filter(n => n.id !== id)
      .map(n => {
        if (childIds.has(n.id)) {
          const stamped = { ...n, createdAt: now };
          toSave.push(stamped);
          return stamped;
        }
        return n;
      });

    if (toSave.length > 0) await saveNodes(toSave);
    set({ nodes: updated });
  },

  // Remove a child atom from a molecule (atom is NOT deleted, just detached).
  removeChildFromNode: async (parentId, childId) => {
    const nodes = get().nodes;
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const updatedChildIds = parent.childIds.filter(cid => cid !== childId);
    const updatedParent = { ...parent, childIds: updatedChildIds };
    await saveNode(updatedParent);

    // Stamp the detached atom sharp
    const now = Date.now();
    const child = nodes.find(n => n.id === childId);
    if (child) {
      const stampedChild = { ...child, createdAt: now };
      await saveNode(stampedChild);
      set({
        nodes: nodes.map(n => {
          if (n.id === parentId) return updatedParent;
          if (n.id === childId) return stampedChild;
          return n;
        }),
      });
    } else {
      set({ nodes: nodes.map(n => n.id === parentId ? updatedParent : n) });
    }
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
// nodes have fully faded and dissolve them automatically.
let dissolving = false;
useNodeStore.subscribe(async (state) => {
  if (dissolving) return;
  const { nodes } = state;
  const baseHalfLife = computeBaseHalfLife();

  // Find all nodes below the dissolution threshold.
  const allFaded = nodes.filter(
    n => getDecay(n, baseHalfLife).retention <= DISSOLVE_THRESHOLD
  );

  // Collect molecules that will dissolve and their child atom ids
  const dissolvingMolecules = allFaded.filter(n => n.level === 'molecule');
  const releasedByMolecule = new Set();
  for (const mol of dissolvingMolecules) {
    for (const cid of mol.childIds) releasedByMolecule.add(cid);
  }

  // Never dissolve atoms that are children of a dissolving molecule —
  // they will be stamped sharp instead.
  const toDissolve = allFaded.filter(n => {
    if (n.level !== 'atom') return true;
    if (releasedByMolecule.has(n.id)) return false;
    // Only dissolve orphan atoms with no live parent
    const hasLiveParent = nodes.some(
      p => p.childIds.includes(n.id) &&
           getDecay(p, baseHalfLife).retention > DISSOLVE_THRESHOLD
    );
    return !hasLiveParent;
  });
  if (toDissolve.length === 0) return;

  dissolving = true;
  try {
    const now = Date.now();

    for (const node of toDissolve) {
      await deleteNode(node.id);
    }
    const dissolvedIds = new Set(toDissolve.map(n => n.id));

    // Remove dissolved nodes, refresh released atoms, clean up childIds
    const toSave = [];
    const remaining = useNodeStore.getState().nodes
      .filter(n => !dissolvedIds.has(n.id))
      .map(n => {
        let updated = n;
        // Stamp released atoms sharp so the user can re-combine them
        if (releasedByMolecule.has(n.id)) {
          updated = { ...updated, createdAt: now };
        }
        // Clean up childIds pointing to dissolved nodes
        if (updated.childIds.some(cid => dissolvedIds.has(cid))) {
          updated = { ...updated, childIds: updated.childIds.filter(cid => !dissolvedIds.has(cid)) };
        }
        if (updated !== n) {
          toSave.push(updated);
        }
        return updated;
      });

    if (toSave.length > 0) await saveNodes(toSave);
    useNodeStore.setState({ nodes: remaining });
  } finally {
    dissolving = false;
  }
});

export default useNodeStore;
