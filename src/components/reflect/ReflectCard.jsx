import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTranslation } from '../../i18n';

export default function ReflectCard({ message, onReflect }) {
  const { t, lang } = useTranslation();
  const [text, setText] = useState('');
  const locale = lang === 'uk' ? { locale: uk } : {};
  const dateStr = format(new Date(message.createdAt), 'd MMMM yyyy', locale);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onReflect(message.id, trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-4">
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
          {t('reflect.originalDate', { date: dateStr })}
        </p>
        <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
          {message.text}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-2">
          {t('reflect.prompt')}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('reflect.placeholder')}
          rows={3}
          className="w-full resize-none rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          aria-label={t('reflect.placeholder')}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          {t('journal.send')}
        </button>
      </div>
    </div>
  );
}
