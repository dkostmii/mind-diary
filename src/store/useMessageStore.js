import { create } from 'zustand';
import { format } from 'date-fns';
import { getAllMessages, saveMessage, deleteMessage } from '../utils/storage';

const useMessageStore = create((set, get) => ({
  messages: [],
  loaded: false,

  loadMessages: async () => {
    const messages = await getAllMessages();
    messages.sort((a, b) => a.createdAt - b.createdAt);
    set({ messages, loaded: true });
  },

  addMessage: async (text) => {
    const now = Date.now();
    const message = {
      id: crypto.randomUUID(),
      text,
      createdAt: now,
      date: format(new Date(now), 'yyyy-MM-dd'),
      reflection: null,
    };
    await saveMessage(message);
    set({ messages: [...get().messages, message] });
    return message;
  },

  addReflection: async (messageId, reflectionText) => {
    const messages = get().messages;
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const updated = {
      ...message,
      reflection: {
        text: reflectionText,
        createdAt: Date.now(),
      },
    };
    await saveMessage(updated);
    set({
      messages: messages.map((m) => (m.id === messageId ? updated : m)),
    });
  },

  removeMessage: async (messageId) => {
    await deleteMessage(messageId);
    set({ messages: get().messages.filter((m) => m.id !== messageId) });
  },

  editMessage: async (messageId, newText) => {
    const messages = get().messages;
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const updated = { ...message, text: newText };
    await saveMessage(updated);
    set({
      messages: messages.map((m) => (m.id === messageId ? updated : m)),
    });
  },

  editReflection: async (messageId, newText) => {
    const messages = get().messages;
    const message = messages.find((m) => m.id === messageId);
    if (!message?.reflection) return;

    const updated = {
      ...message,
      reflection: { ...message.reflection, text: newText },
    };
    await saveMessage(updated);
    set({
      messages: messages.map((m) => (m.id === messageId ? updated : m)),
    });
  },

  bulkImport: async (newMessages) => {
    const existing = get().messages;
    const existingIds = new Set(existing.map((m) => m.id));
    const toAdd = newMessages.filter((m) => !existingIds.has(m.id));
    for (const msg of toAdd) {
      await saveMessage(msg);
    }
    const merged = [...existing, ...toAdd].sort((a, b) => a.createdAt - b.createdAt);
    set({ messages: merged });
    return toAdd.length;
  },

  removeReflection: async (messageId) => {
    const messages = get().messages;
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const updated = { ...message, reflection: null };
    await saveMessage(updated);
    set({
      messages: messages.map((m) => (m.id === messageId ? updated : m)),
    });
  },
}));

export default useMessageStore;
