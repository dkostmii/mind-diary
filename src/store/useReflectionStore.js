import { create } from 'zustand';
import { getAllReflections, saveReflection, deleteReflection } from '../utils/storage';

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
    return reflection;
  },

  removeReflection: async (id) => {
    await deleteReflection(id);
    set({ reflections: get().reflections.filter((r) => r.id !== id) });
  },
}));

export default useReflectionStore;
