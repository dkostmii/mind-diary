import { GoogleGenerativeAI } from '@google/generative-ai';

export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/**
 * Sanitize message history for Gemini API:
 * - Must start with a user message
 * - Must alternate user/model (merge consecutive same-role messages)
 */
function buildGeminiHistory(contextMessages) {
  // Drop leading AI messages (Gemini requires user-first)
  let start = 0;
  while (start < contextMessages.length && contextMessages[start].role === 'ai') {
    start++;
  }
  const trimmed = contextMessages.slice(start);
  if (trimmed.length === 0) return { history: [], lastMessage: null };

  // Merge consecutive same-role messages
  const merged = [];
  for (const msg of trimmed) {
    const geminiRole = msg.role === 'ai' ? 'model' : 'user';
    const last = merged[merged.length - 1];
    if (last && last.role === geminiRole) {
      last.text += '\n' + msg.text;
    } else {
      merged.push({ role: geminiRole, text: msg.text });
    }
  }

  const lastMessage = merged.pop();
  const history = merged.map(m => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  return { history, lastMessage };
}

/**
 * Send messages to Gemini and get a response.
 * @param {string} apiKey
 * @param {{ role: 'user' | 'ai', text: string }[]} contextMessages - remaining (non-faded) messages
 * @returns {Promise<string>} AI response text
 */
export async function sendToGemini(apiKey, contextMessages) {
  if (!contextMessages.length) {
    throw new Error('No messages to send');
  }

  const { history, lastMessage } = buildGeminiHistory(contextMessages);
  if (!lastMessage) {
    throw new Error('No valid messages after filtering');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.text);
  return result.response.text();
}
