import { useState, useRef, useCallback } from 'react';
import { Send, Maximize2, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import useChatStore from '../../store/useChatStore';
import { API_KEY, sendToGemini } from '../../engine/gemini';

export default function Composer({ onToast }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef(null);
  const fullscreenRef = useRef(null);

  const addMessage = useChatStore((s) => s.addMessage);
  const pruneMessages = useChatStore((s) => s.pruneMessages);
  const loading = useChatStore((s) => s.loading);
  const startLoading = useChatStore((s) => s.startLoading);
  const stopLoading = useChatStore((s) => s.stopLoading);

  const handleInput = (e) => {
    setText(e.target.value);
    if (!fullscreen) {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setText('');
    setFullscreen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await addMessage('user', trimmed);

    const { remaining, prunedCount } = await pruneMessages();

    if (prunedCount > 0) {
      onToast(t('toast.forgotten', { count: prunedCount }));
    }

    if (!API_KEY) return;

    startLoading();
    try {
      const context = remaining.map(m => ({ role: m.role, text: m.text }));
      const response = await sendToGemini(API_KEY, context);
      await stopLoading();
      await addMessage('ai', response);
    } catch (err) {
      console.error('Gemini API error:', err);
      await stopLoading();
      await addMessage('ai', t('error.apiFailed'));
    }
  }, [text, loading, addMessage, pruneMessages, startLoading, stopLoading, onToast, t]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape' && fullscreen) {
      setFullscreen(false);
    }
  };

  return (
    <>
      {/* Inline composer */}
      <div className="shrink-0 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <div
            className="flex-1 flex items-center rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden"
            onClick={() => textareaRef.current?.focus()}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={t('composer.placeholder')}
              disabled={loading}
              rows={1}
              className="flex-1 resize-none bg-transparent px-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none disabled:opacity-50"
              aria-label={t('composer.placeholder')}
            />
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              disabled={loading}
              className="p-2 text-stone-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={loading || !text.trim()}
            className="rounded-xl bg-indigo-600 p-2.5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            aria-label={t('composer.send')}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-50 dark:bg-stone-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              <X size={20} />
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !text.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              <Send size={16} />
              {t('composer.send')}
            </button>
          </div>
          <textarea
            ref={fullscreenRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={t('composer.placeholder')}
            autoFocus
            className="flex-1 resize-none bg-transparent px-4 py-4 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none text-base leading-relaxed"
          />
        </div>
      )}
    </>
  );
}
