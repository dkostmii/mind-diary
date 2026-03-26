import { create } from 'zustand';
import { getAllNodes, saveNode, saveNodes, deleteNode, clearAllNodes } from '../utils/storage';
import { refreshNode } from '../engine/decay';

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

    const refreshed = refreshNode(node);
    await saveNode(refreshed);
    set({ nodes: nodes.map(n => n.id === id ? refreshed : n) });
  },

  combineNodes: async (childIds, note = null) => {
    const nodes = get().nodes;
    const children = nodes.filter(n => childIds.includes(n.id));
    if (children.length < 2) return null;

    // Determine level: if any child is a molecule/story -> story, else molecule
    const hasNonAtom = children.some(n => n.level !== 'atom');
    const level = hasNonAtom ? 'story' : 'molecule';

    const now = Date.now();
    const allChildIds = [...childIds];

    // If note provided, create a text atom for it and include as child
    let noteAtom = null;
    if (note && note.trim()) {
      noteAtom = {
        id: genId(),
        level: 'atom',
        type: 'text',
        content: { excerpt: note.trim() },
        childIds: [],
        note: null,
        createdAt: now,
        lastInteractedAt: now,
        interactionCount: 1,
      };
      allChildIds.push(noteAtom.id);
    }

    const newNode = {
      id: genId(),
      level,
      type: null,
      content: null,
      childIds: allChildIds,
      note: note ? note.trim() : null,
      createdAt: now,
      lastInteractedAt: now,
      interactionCount: 1,
    };

    // Refresh all children
    const refreshedChildren = children.map(c => refreshNode(c));
    const nodesToSave = [...refreshedChildren, newNode];
    if (noteAtom) nodesToSave.push(noteAtom);

    await saveNodes(nodesToSave);

    const updatedNodes = get().nodes.map(n => {
      const refreshed = refreshedChildren.find(r => r.id === n.id);
      return refreshed || n;
    });

    const newNodes = [newNode];
    if (noteAtom) newNodes.push(noteAtom);

    set({ nodes: [...updatedNodes, ...newNodes] });
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

export default useNodeStore;
