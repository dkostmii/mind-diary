import { useState } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTranslation } from '../../i18n';
import ReflectionBadge from '../reflect/ReflectionBadge';

export default function HistoryFeed({
  messages,
  onReflect,
  onDeleteMessage,
  onEditMessage,
  onDeleteReflection,
  onEditReflection,
}) {
  const { t, lang } = useTranslation();
  const [expanded, setExpanded] = useState(null);
  const [confirmingMsg, setConfirmingMsg] = useState(null);
  const [confirmingRef, setConfirmingRef] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editingRef, setEditingRef] = useState(null);
  const [editText, setEditText] = useState('');
  const locale = lang === 'uk' ? { locale: uk } : {};

  const toggleExpand = (id) => {
    setExpanded(expanded === id ? null : id);
  };

  const startEditMsg = (e, msg) => {
    e.stopPropagation();
    setEditingMsg(msg.id);
    setEditText(msg.text);
  };

  const startEditRef = (e, msg) => {
    e.stopPropagation();
    setEditingRef(msg.id);
    setEditText(msg.reflection.text);
  };

  const saveEditMsg = (id) => {
    const trimmed = editText.trim();
    if (trimmed) onEditMessage(id, trimmed);
    setEditingMsg(null);
  };

  const saveEditRef = (id) => {
    const trimmed = editText.trim();
    if (trimmed) onEditReflection(id, trimmed);
    setEditingRef(null);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingMsg(null);
    setEditingRef(null);
    setEditText('');
  };

  return (
    <div className="px-4 py-2 space-y-3">
      {messages.map((msg) => {
        const dateStr = format(new Date(msg.createdAt), 'd MMM yyyy HH:mm', locale);
        const isExpanded = expanded === msg.id;

        return (
          <div
            key={msg.id}
            className={`rounded-xl border p-4 transition-colors ${
              msg.reflection
                ? 'border-stone-200 dark:border-stone-700 cursor-pointer'
                : 'border-indigo-200 dark:border-indigo-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
            onClick={() => {
              if (editingMsg === msg.id || editingRef === msg.id) return;
              if (!msg.reflection) {
                onReflect(msg.id);
              } else {
                toggleExpand(msg.id);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (editingMsg === msg.id || editingRef === msg.id) return;
                if (!msg.reflection) {
                  onReflect(msg.id);
                } else {
                  toggleExpand(msg.id);
                }
              }
            }}
          >
            {/* Message */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">
                  {dateStr}
                </p>
                {editingMsg === msg.id ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          saveEditMsg(msg.id);
                        }
                        if (e.key === 'Escape') cancelEdit(e);
                      }}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEditMsg(msg.id)}
                        disabled={!editText.trim()}
                        className="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-xs rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}
              </div>
              {msg.reflection && <ReflectionBadge />}
            </div>

            {/* Message actions */}
            {editingMsg !== msg.id && (
              <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => startEditMsg(e, msg)}
                  className="px-2 py-0.5 text-xs rounded text-stone-500 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                >
                  {t('common.edit')}
                </button>
                {confirmingMsg === msg.id ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteMessage(msg.id); setConfirmingMsg(null); }}
                      className="px-2 py-0.5 text-xs rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {t('common.confirmDelete')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmingMsg(null); }}
                      className="px-2 py-0.5 text-xs rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmingMsg(msg.id); }}
                    className="px-2 py-0.5 text-xs rounded text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            )}

            {/* Reflection */}
            {msg.reflection && isExpanded && (
              <div className="mt-3 pl-4 border-l-2 border-indigo-400 dark:border-indigo-600">
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">
                  {t('history.reflectionLabel')} —{' '}
                  {format(new Date(msg.reflection.createdAt), 'd MMM yyyy', locale)}
                </p>
                {editingRef === msg.id ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          saveEditRef(msg.id);
                        }
                        if (e.key === 'Escape') cancelEdit(e);
                      }}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-3 py-2 text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEditRef(msg.id)}
                        disabled={!editText.trim()}
                        className="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 text-xs rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words">
                    {msg.reflection.text}
                  </p>
                )}

                {/* Reflection actions */}
                {editingRef !== msg.id && (
                  <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => startEditRef(e, msg)}
                      className="px-2 py-0.5 text-xs rounded text-stone-500 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                    >
                      {t('common.edit')}
                    </button>
                    {confirmingRef === msg.id ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteReflection(msg.id); setConfirmingRef(null); }}
                          className="px-2 py-0.5 text-xs rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          {t('common.confirmDelete')}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmingRef(null); }}
                          className="px-2 py-0.5 text-xs rounded text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmingRef(msg.id); }}
                        className="px-2 py-0.5 text-xs rounded text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                      >
                        {t('common.delete')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
