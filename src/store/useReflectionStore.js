import { create } from 'zustand';
import { getAllReflections, saveReflection, deleteReflection } from '../utils/storage';
import { extractFragmentsFromReflection } from '../engine/fragmentExtractor';
import useFragmentStore from './useFragmentStore';

function genId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const useReflectionStore = create((set, get) => ({
  reflections: [],
  loaded: false,

  loadReflections: async () => {
    const reflections = await getAllReflections();
    set({ reflections, loaded: true });

    // Backfill: extract fragments from reflections that were saved
    // before the perpetual cycle was added
    const existingFragments = useFragmentStore.getState().fragments;
    const reflectionIdsWithFragments = new Set(
      existingFragments.filter((f) => f.sourceReflectionId).map((f) => f.sourceReflectionId)
    );
    for (const r of reflections) {
      if (!reflectionIdsWithFragments.has(r.id)) {
        const newFrags = extractFragmentsFromReflection(r);
        if (newFrags.length > 0) {
          await useFragmentStore.getState().addFragments(newFrags);
        }
      }
    }
  },

  addReflection: async (fragmentIds, text, images = [], location = null) => {
    const reflection = {
      id: genId(),
      fragmentIds,
      text,
      images,
      location,
      createdAt: Date.now(),
    };
    await saveReflection(reflection);
    set({ reflections: [...get().reflections, reflection] });

    // Extract fragments from the reflection's content (perpetual cycle)
    const fragments = extractFragmentsFromReflection(reflection);
    if (fragments.length > 0) {
      await useFragmentStore.getState().addFragments(fragments);
    }

    return reflection;
  },

  removeReflection: async (id) => {
    // Cascade delete fragments sourced from this reflection
    await useFragmentStore.getState().removeFragmentsByReflectionId(id);
    await deleteReflection(id);
    set({ reflections: get().reflections.filter((r) => r.id !== id) });
  },
}));

export default useReflectionStore;
