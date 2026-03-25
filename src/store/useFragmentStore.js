import { create } from 'zustand';
import { getAllFragments, saveFragment, deleteFragmentsByMessageId } from '../utils/storage';

const useFragmentStore = create((set, get) => ({
  fragments: [],
  loaded: false,

  loadFragments: async () => {
    const fragments = await getAllFragments();
    set({ fragments, loaded: true });
  },

  addFragments: async (newFragments) => {
    for (const frag of newFragments) {
      await saveFragment(frag);
    }
    set({ fragments: [...get().fragments, ...newFragments] });
  },

  removeFragmentsByMessageId: async (messageId) => {
    await deleteFragmentsByMessageId(messageId);
    set({
      fragments: get().fragments.filter((f) => f.sourceMessageId !== messageId),
    });
  },
}));

export default useFragmentStore;
