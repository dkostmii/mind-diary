import { create } from 'zustand';
import { getAllNodes, saveNode, saveNodes, deleteNode, clearAllNodes } from '../utils/storage';
import {
  getDecay, getStrength, DISSOLVE_THRESHOLD, DEFAULT_STABILITY,
  applyTicksToAtom, reinforceAtom,
  computePassiveTicks, getLastActiveTimestamp, setLastActiveTimestamp,
} from '../engine/decay';

function genId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const useNodeStore = create((set, get) => ({
  nodes: [],
  loaded: false,

  // ── Load + passive ticks on startup ──────────────────────────────────────

  loadNodes: async () => {
    let nodes = await getAllNodes();

    // Apply passive ticks accumulated while the app was closed
    const lastActive = getLastActiveTimestamp();
    if (lastActive) {
      const passiveTicks = computePassiveTicks(lastActive);
      if (passiveTicks > 0) {
        const toSave = [];
        nodes = nodes.map(n => {
          if (n.level !== 'atom') return n;
          const updated = applyTicksToAtom(n, passiveTicks);
          if (updated !== n) toSave.push(updated);
          return updated;
        });
        if (toSave.length > 0) await saveNodes(toSave);
      }
    }
    setLastActiveTimestamp();

    set({ nodes, loaded: true });
  },

  // ── Tick system ──────────────────────────────────────────────────────────

  /**
   * Tick all atoms EXCEPT those in excludeIds by 1.
   * Called on every meaningful user action.
   */
  tickOtherAtoms: async (excludeIds = []) => {
    const excludeSet = new Set(excludeIds);
    const nodes = get().nodes;
    const toSave = [];
    const updated = nodes.map(n => {
      if (n.level !== 'atom' || excludeSet.has(n.id)) return n;
      const ticked = applyTicksToAtom(n, 1);
      toSave.push(ticked);
      return ticked;
    });
    if (toSave.length > 0) await saveNodes(toSave);
    setLastActiveTimestamp();
    set({ nodes: updated });
  },

  // ── Strengthening ────────────────────────────────────────────────────────

  /**
   * Reinforce an atom: increase its stability and reset ticks.
   * Also ticks all OTHER atoms by 1 (interaction tick).
   */
  strengthenAtom: async (atomId) => {
    const nodes = get().nodes;
    const atom = nodes.find(n => n.id === atomId);
    if (!atom || atom.level !== 'atom') return;

    const reinforced = reinforceAtom(atom);
    await saveNode(reinforced);

    // Tick all other atoms
    const toSave = [reinforced];
    const updated = nodes.map(n => {
      if (n.id === atomId) return reinforced;
      if (n.level !== 'atom') return n;
      const ticked = applyTicksToAtom(n, 1);
      toSave.push(ticked);
      return ticked;
    });
    await saveNodes(toSave);
    setLastActiveTimestamp();
    set({ nodes: updated });
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────

  addNodes: async (newNodes, { fromComposer = false } = {}) => {
    await saveNodes(newNodes);
    const nodes = get().nodes;

    if (fromComposer) {
      // Tick all existing atoms (new ones are excluded since they're fresh)
      const newIds = new Set(newNodes.map(n => n.id));
      const toSave = [];
      const ticked = nodes.map(n => {
        if (n.level !== 'atom' || newIds.has(n.id)) return n;
        const updated = applyTicksToAtom(n, 1);
        toSave.push(updated);
        return updated;
      });
      if (toSave.length > 0) await saveNodes(toSave);
      setLastActiveTimestamp();
      set({ nodes: [...ticked, ...newNodes] });
    } else {
      set({ nodes: [...nodes, ...newNodes] });
    }
  },

  removeNode: async (id) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);

    await deleteNode(id);

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

  /**
   * Stamp createdAt to now + reset ticks on a node and its children.
   * Used when selecting a fading node before using it in the composer.
   */
  refreshCreatedAt: async (id) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);
    if (!node) return;

    const now = Date.now();
    const refresh = (n) => ({
      ...n,
      createdAt: now,
      ticksSinceReinforcement: 0,
      lastReinforcedAt: now,
    });

    const stamped = refresh(node);
    const toSave = [stamped];

    if (node.childIds.length > 0) {
      for (const cid of node.childIds) {
        const child = nodes.find(n => n.id === cid);
        if (child) toSave.push(refresh(child));
      }
    }

    await saveNodes(toSave);
    const stampedMap = new Map(toSave.map(n => [n.id, n]));
    set({ nodes: nodes.map(n => stampedMap.get(n.id) || n) });
  },

  // ── Combine ──────────────────────────────────────────────────────────────

  combineNodes: async (childIds, note = null, attachments = []) => {
    const nodes = get().nodes;
    const selected = nodes.filter(n => childIds.includes(n.id));
    if (selected.length < 2) return null;

    // Flatten: if any selected node is a molecule, pull its atom children
    const flatAtomIds = [];
    const consumedIds = [];
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
    const base = {
      level: 'atom', childIds: [], note: null, createdAt: now,
      stability: DEFAULT_STABILITY, reinforcementCount: 0,
      ticksSinceReinforcement: 0, lastReinforcedAt: now,
    };
    const allChildIds = [...flatAtomIds];
    const extraAtoms = [];

    if (note && note.trim()) {
      const noteAtom = { ...base, id: genId(), type: 'text',
                         content: { excerpt: note.trim() } };
      extraAtoms.push(noteAtom);
      allChildIds.push(noteAtom.id);
    }

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

    // Reinforce existing child atoms (combining = strengthening)
    const reinforcedAtoms = [];
    for (const aid of flatAtomIds) {
      const atom = nodes.find(n => n.id === aid);
      if (atom) reinforcedAtoms.push(reinforceAtom(atom));
    }

    // Tick all OTHER atoms (interaction tick)
    const involvedIds = new Set([...allChildIds, newNode.id]);
    const tickedAtoms = [];
    for (const n of nodes) {
      if (n.level === 'atom' && !involvedIds.has(n.id)) {
        tickedAtoms.push(applyTicksToAtom(n, 1));
      }
    }

    const nodesToSave = [...reinforcedAtoms, ...tickedAtoms, newNode, ...extraAtoms];

    for (const id of consumedIds) {
      await deleteNode(id);
    }
    await saveNodes(nodesToSave);
    setLastActiveTimestamp();

    const consumedSet = new Set(consumedIds);
    const saveMap = new Map(nodesToSave.map(n => [n.id, n]));
    const updatedNodes = get().nodes
      .filter(n => !consumedSet.has(n.id))
      .map(n => saveMap.get(n.id) || n);

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

    // Reinforce added children
    const addedChildren = nodes.filter(n => newChildIds.includes(n.id));
    const reinforcedChildren = addedChildren.map(c => reinforceAtom(c));

    // Tick all other atoms
    const involvedIds = new Set([parentId, ...newChildIds]);
    const tickedAtoms = [];
    for (const n of nodes) {
      if (n.level === 'atom' && !involvedIds.has(n.id)) {
        tickedAtoms.push(applyTicksToAtom(n, 1));
      }
    }

    const nodesToSave = [stampedParent, ...reinforcedChildren, ...tickedAtoms];
    await saveNodes(nodesToSave);
    setLastActiveTimestamp();

    const saveMap = new Map(nodesToSave.map(n => [n.id, n]));
    set({ nodes: nodes.map(n => saveMap.get(n.id) || n) });
  },

  // ── Dissolve / detach ────────────────────────────────────────────────────

  dissolveMolecule: async (id) => {
    const nodes = get().nodes;
    const node = nodes.find(n => n.id === id);
    if (!node || node.level !== 'molecule') return;

    await deleteNode(id);

    // Reinforce child atoms so user can recombine them
    const childIds = new Set(node.childIds);
    const toSave = [];
    const updated = nodes
      .filter(n => n.id !== id)
      .map(n => {
        if (childIds.has(n.id)) {
          const reinforced = reinforceAtom(n);
          toSave.push(reinforced);
          return reinforced;
        }
        return n;
      });

    if (toSave.length > 0) await saveNodes(toSave);
    set({ nodes: updated });
  },

  removeChildFromNode: async (parentId, childId) => {
    const nodes = get().nodes;
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;

    const updatedChildIds = parent.childIds.filter(cid => cid !== childId);
    const updatedParent = { ...parent, childIds: updatedChildIds };
    await saveNode(updatedParent);

    const child = nodes.find(n => n.id === childId);
    if (child) {
      const reinforced = reinforceAtom(child);
      await saveNode(reinforced);
      set({
        nodes: nodes.map(n => {
          if (n.id === parentId) return updatedParent;
          if (n.id === childId) return reinforced;
          return n;
        }),
      });
    } else {
      set({ nodes: nodes.map(n => n.id === parentId ? updatedParent : n) });
    }
  },

  // ── Import / export ──────────────────────────────────────────────────────

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

// ── Event-driven dissolution ─────────────────────────────────────────────────
// Dissolution is gated: only runs after any user-triggered store change
// (passive ticks on load already applied, so nodes won't mass-dissolve on open).

let dissolving = false;
let storeReady = false;

// Enable dissolution after the first loadNodes completes
useNodeStore.subscribe((state) => {
  if (state.loaded) storeReady = true;
});

useNodeStore.subscribe(async (state) => {
  if (!storeReady || dissolving) return;
  const { nodes } = state;

  const allFaded = nodes.filter(
    n => getDecay(n, nodes).retention <= DISSOLVE_THRESHOLD
  );

  const dissolvingMolecules = allFaded.filter(n => n.level === 'molecule');
  const releasedByMolecule = new Set();
  for (const mol of dissolvingMolecules) {
    for (const cid of mol.childIds) releasedByMolecule.add(cid);
  }

  const toDissolve = allFaded.filter(n => {
    if (n.level !== 'atom') return true;
    if (releasedByMolecule.has(n.id)) return false;
    const hasLiveParent = nodes.some(
      p => p.childIds.includes(n.id) &&
           getDecay(p, nodes).retention > DISSOLVE_THRESHOLD
    );
    return !hasLiveParent;
  });
  if (toDissolve.length === 0) return;

  dissolving = true;
  try {
    for (const node of toDissolve) {
      await deleteNode(node.id);
    }
    const dissolvedIds = new Set(toDissolve.map(n => n.id));

    const toSave = [];
    const remaining = useNodeStore.getState().nodes
      .filter(n => !dissolvedIds.has(n.id))
      .map(n => {
        let updated = n;
        if (releasedByMolecule.has(n.id)) {
          updated = reinforceAtom(updated);
        }
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

// Periodically update last-active timestamp while app is open
setInterval(() => setLastActiveTimestamp(), 60_000);

export default useNodeStore;
