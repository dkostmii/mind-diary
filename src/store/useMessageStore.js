import { create } from 'zustand';
import { format } from 'date-fns';
import { getAllMessages, saveMessage, deleteMessage } from '../utils/storage';
import { extractFragments } from '../engine/fragmentExtractor';
import useFragmentStore from './useFragmentStore';

const useMessageStore = create((set, get) => ({
  messages: [],
  loaded: false,

  loadMessages: async () => {
    const messages = await getAllMessages();
    messages.sort((a, b) => a.createdAt - b.createdAt);
    set({ messages, loaded: true });
  },

  addMessage: async (text, images = [], location = null) => {
    const now = Date.now();
    const message = {
      id: typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      text,
      images,
      location,
      createdAt: now,
      date: format(new Date(now), 'yyyy-MM-dd'),
      reflection: null,
    };
    await saveMessage(message);
    set({ messages: [...get().messages, message] });

    const fragments = extractFragments(message);
    if (fragments.length > 0) {
      await useFragmentStore.getState().addFragments(fragments);
    }

    return message;
  },

  addReflection: async (messageId, reflectionText, images = [], location = null) => {
    const messages = get().messages;
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const updated = {
      ...message,
      reflection: {
        text: reflectionText,
        images,
        location,
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

    // Cascade delete fragments for this message
    await useFragmentStore.getState().removeFragmentsByMessageId(messageId);
  },

  editMessage: async (messageId, newText, newImages, newLocation) => {
    const messages = get().messages;
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const updated = { ...message, text: newText, images: newImages ?? message.images ?? [], location: newLocation !== undefined ? newLocation : message.location ?? null };
    await saveMessage(updated);
    set({
      messages: messages.map((m) => (m.id === messageId ? updated : m)),
    });
  },

  editReflection: async (messageId, newText, newImages, newLocation) => {
    const messages = get().messages;
    const message = messages.find((m) => m.id === messageId);
    if (!message?.reflection) return;

    const updated = {
      ...message,
      reflection: { ...message.reflection, text: newText, images: newImages ?? message.reflection.images ?? [], location: newLocation !== undefined ? newLocation : message.reflection.location ?? null },
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

    for (const msg of toAdd) {
      const fragments = extractFragments(msg);
      if (fragments.length > 0) {
        await useFragmentStore.getState().addFragments(fragments);
      }
    }

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
