import { useState, useCallback } from 'react';
import { useTranslation } from '../i18n';
import useChatStore from '../store/useChatStore';
import Canvas from '../components/canvas/Canvas';
import Composer from '../components/composer/Composer';
import Toast from '../components/shared/Toast';
import { API_KEY, sendToGemini } from '../engine/gemini';

export default function Main() {
  const { t } = useTranslation();
  const messages = useChatStore((s) => s.messages);
  const [toast, setToast] = useState(null);

  const handleToast = useCallback((message) => {
    setToast(message);
  }, []);

  const handleRetry = useCallback(async (messageId) => {
    if (!API_KEY) return;
    const { pruneMessages, addMessage, startLoading, stopLoading } = useChatStore.getState();
    const messages = useChatStore.getState().messages;

    const original = messages.find(m => m.id === messageId);
    if (!original) return;

    await addMessage('user', original.text);

    const { remaining, prunedCount } = await pruneMessages();
    if (prunedCount > 0) {
      handleToast(t('toast.forgotten', { count: prunedCount }));
    }

    const context = remaining.map(m => ({ role: m.role, text: m.text }));

    startLoading();
    try {
      const response = await sendToGemini(API_KEY, context);
      await stopLoading();
      await addMessage('ai', response);
    } catch (err) {
      console.error('Gemini API error:', err);
      await stopLoading();
      await addMessage('ai', t('error.apiFailed'));
    }
  }, [t, handleToast]);

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200 text-center">
          {t('app.name')}
        </h1>
      </header>

      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-stone-400 dark:text-stone-500 text-sm text-center">
            {t('canvas.emptyState')}
          </p>
        </div>
      ) : (
        <Canvas onRetry={handleRetry} />
      )}

      <Composer onToast={handleToast} />

      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
