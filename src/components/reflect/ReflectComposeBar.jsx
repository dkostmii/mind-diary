import { useState } from 'react';
import { useTranslation } from '../../i18n';

export default function ReflectComposeBar({ messageId, onReflect }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onReflect(messageId, trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-4 py-3">
      <div className="flex items-end gap-2 max-w-lg mx-auto">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('reflect.placeholder')}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label={t('reflect.placeholder')}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          aria-label={t('nav.reflect')}
        >
          {t('nav.reflect')}
        </button>
      </div>
    </div>
  );
}
