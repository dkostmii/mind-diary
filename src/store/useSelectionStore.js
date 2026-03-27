import { create } from 'zustand';

const useSelectionStore = create((set, get) => ({
  selectedIds: [],

  toggle: (id) => {
    const current = get().selectedIds;
    if (current.includes(id)) {
      set({ selectedIds: current.filter(sid => sid !== id) });
    } else {
      set({ selectedIds: [...current, id] });
    }
  },

  clear: () => set({ selectedIds: [] }),

  isSelected: (id) => get().selectedIds.includes(id),
}));

export default useSelectionStore;
