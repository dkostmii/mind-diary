import { create } from 'zustand';
import {
  getAllMessages, saveMessage, saveMessages,
  deleteMessages, clearAllMessages,
} from '../utils/storage';
import { getStrength, reinforceMessage, DEFAULT_STABILITY, FORGET_THRESHOLD } from '../engine/decay';

function genId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const useChatStore = create((set, get) => ({
  messages: [],
  loaded: false,
  loading: false,
  loadingStartedAt: null,
  decayTick: 0,

  loadMessages: async () => {
    const messages = await getAllMessages();
    messages.sort((a, b) => a.createdAt - b.createdAt);
    set({ messages, loaded: true });
  },

  addMessage: async (role, text) => {
    const now = Date.now();
    const msg = {
      id: genId(),
      role,
      text,
      createdAt: now,
      lastInteractionTime: now,
      stability: DEFAULT_STABILITY,
      reinforcementCount: 0,
    };
    await saveMessage(msg);
    set({ messages: [...get().messages, msg] });
    return msg;
  },

  strengthenMessage: async (id) => {
    const messages = get().messages;
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    const reinforced = reinforceMessage(msg);
    await saveMessage(reinforced);
    set({ messages: messages.map(m => m.id === id ? reinforced : m) });
  },

  pruneMessages: async () => {
    const messages = get().messages;
    const faded = [];
    const remaining = [];

    for (const msg of messages) {
      const strength = getStrength(msg.lastInteractionTime, msg.stability);
      if (strength < FORGET_THRESHOLD) {
        faded.push(msg);
      } else {
        remaining.push(msg);
      }
    }

    if (faded.length > 0) {
      await deleteMessages(faded.map(m => m.id));
      set({ messages: remaining });
    }

    return { remaining, prunedCount: faded.length };
  },

  /**
   * Start loading — record when it started so we can pause decay.
   */
  startLoading: () => set({ loading: true, loadingStartedAt: Date.now() }),

  /**
   * Stop loading — shift all messages' lastInteractionTime forward
   * by the loading duration so decay resumes from where it paused.
   */
  stopLoading: async () => {
    const { loadingStartedAt, messages } = get();
    if (!loadingStartedAt) {
      set({ loading: false, loadingStartedAt: null });
      return;
    }

    const pauseDuration = Date.now() - loadingStartedAt;
    const shifted = messages.map(msg => ({
      ...msg,
      lastInteractionTime: msg.lastInteractionTime + pauseDuration,
    }));

    await saveMessages(shifted);
    set({ messages: shifted, loading: false, loadingStartedAt: null });
  },

  clearAll: async () => {
    await clearAllMessages();
    set({ messages: [] });
  },
}));

// Global decay tick — drives visual updates every 500ms
setInterval(() => {
  useChatStore.setState((s) => ({ decayTick: s.decayTick + 1 }));
}, 500);

export default useChatStore;
