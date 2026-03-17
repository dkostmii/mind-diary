import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n';

export default function ComposeBar({ onSend }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, onSend]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-4 py-3">
      <div className="flex items-end gap-2 max-w-lg mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={t('journal.placeholder')}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label={t('journal.placeholder')}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          aria-label={t('journal.send')}
        >
          {t('journal.send')}
        </button>
      </div>
    </div>
  );
}
