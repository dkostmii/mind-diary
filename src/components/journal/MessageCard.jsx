import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTranslation } from '../../i18n';

export default function MessageCard({ message, onDelete, onEdit }) {
  const { t, lang } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const date = new Date(message.createdAt);
  const locale = lang === 'uk' ? { locale: uk } : {};

  let dateStr;
  if (isToday(date)) {
    dateStr = `${t('journal.today')} ${format(date, 'HH:mm')}`;
  } else if (isYesterday(date)) {
    dateStr = `${t('journal.yesterday')} ${format(date, 'HH:mm')}`;
  } else {
    dateStr = format(date, 'd MMM yyyy HH:mm', locale);
  }

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.text) {
      setEditing(false);
      setEditText(message.text);
      return;
    }
    onEdit(message.id, trimmed);
    setEditing(false);
  };

  return (
    <div className="group py-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-stone-500 dark:text-stone-400">{dateStr}</p>
        {!editing && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditing(true); setEditText(message.text); }}
              className="px-2 py-0.5 text-xs rounded text-stone-500 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label={t('common.edit')}
            >
              {t('common.edit')}
            </button>
            {confirming ? (
              <>
                <button
                  onClick={() => onDelete(message.id)}
                  className="px-2 py-0.5 text-xs rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  {t('common.confirmDelete')}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-2 py-0.5 text-xs rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="px-2 py-0.5 text-xs rounded text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label={t('common.delete')}
              >
                {t('common.delete')}
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSaveEdit();
              }
              if (e.key === 'Escape') {
                setEditing(false);
                setEditText(message.text);
              }
            }}
            rows={2}
            className="w-full resize-none rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={!editText.trim()}
              className="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              {t('common.save')}
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(message.text); }}
              className="px-3 py-1 text-xs rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
          {message.text}
        </p>
      )}
    </div>
  );
}
