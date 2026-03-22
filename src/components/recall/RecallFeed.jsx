import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Virtuoso } from 'react-virtuoso';
import { Pencil, Trash2, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import ReflectionBadge from '../reflect/ReflectionBadge';
import ConfirmModal from '../shared/ConfirmModal';
import EditModal from '../shared/EditModal';
import LinkifyText from '../shared/LinkifyText';
import ImageThumbnails from '../shared/ImageThumbnails';
import LocationButton from '../shared/LocationButton';

export default function RecallFeed({
  messages,
  userName,
  onReflect,
  onDeleteMessage,
  onEditMessage,
  onDeleteReflection,
  onEditReflection,
}) {
  const { t, lang } = useTranslation();
  const [confirmingMsg, setConfirmingMsg] = useState(null);
  const [confirmingRef, setConfirmingRef] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editingRef, setEditingRef] = useState(null);
  const locale = lang === 'uk' ? { locale: uk } : {};

  const editingMsgData = editingMsg && messages.find((m) => m.id === editingMsg);
  const editingRefData = editingRef && messages.find((m) => m.id === editingRef);

  const itemContent = useCallback(
    (index) => {
      const msg = messages[index];
      const dateStr = format(new Date(msg.createdAt), 'd MMM yyyy HH:mm', locale);
      return (
        <div className="px-4 py-1.5">
          <div
            className={`rounded-xl border p-4 transition-colors ${
              msg.reflection
                ? 'border-stone-200 dark:border-stone-700'
                : 'border-indigo-200 dark:border-indigo-800'
            }`}
          >
            {/* Message header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500">{dateStr}</p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {t('recall.authorWrites', { name: userName })}
                </p>
              </div>
              {msg.reflection ? (
                <span className="flex items-center gap-1.5 shrink-0">
                  <ReflectionBadge />
                  <span className="text-sm text-indigo-500 dark:text-indigo-400">{t('recall.reflected')}</span>
                </span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onReflect(msg.id); }}
                  className="inline-flex items-center gap-1 shrink-0 px-3 py-1.5 text-sm rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <MessageCircle size={14} />
                  {t('reflect.action')}
                </button>
              )}
            </div>

            {/* Message content */}
            <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
              <LinkifyText>{msg.text}</LinkifyText>
            </p>
            <ImageThumbnails images={msg.images} />
            <LocationButton location={msg.location} />

            {/* Message actions */}
            <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); setEditingMsg(msg.id); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <Pencil size={14} />
                {t('common.edit')}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmingMsg(msg.id); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                <Trash2 size={14} />
                {t('common.delete')}
              </button>
            </div>

            {/* Reflection */}
            {msg.reflection && (
              <div className="mt-3 pl-4 border-l-2 border-indigo-400 dark:border-indigo-600">
                <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">
                  {t('recall.authorReflects', { name: userName })} —{' '}
                  {format(new Date(msg.reflection.createdAt), 'd MMM yyyy HH:mm', locale)}
                </p>
                <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words">
                  <LinkifyText>{msg.reflection.text}</LinkifyText>
                </p>
                <ImageThumbnails images={msg.reflection.images} />
                <LocationButton location={msg.reflection.location} />

                {/* Reflection actions */}
                <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingRef(msg.id); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <Pencil size={14} />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmingRef(msg.id); }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <Trash2 size={14} />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    },
    [messages, userName, locale, t, onReflect]
  );

  return (
    <>
      <Virtuoso
        className="flex-1 min-h-0"
        totalCount={messages.length}
        itemContent={itemContent}
      />

      {editingMsg !== null && createPortal(
        <EditModal
          open
          initialText={editingMsgData?.text || ''}
          initialImages={editingMsgData?.images}
          initialLocation={editingMsgData?.location}
          onSave={(text, images, location) => { onEditMessage(editingMsg, text, images, location); setEditingMsg(null); }}
          onCancel={() => setEditingMsg(null)}
        />,
        document.body
      )}
      {editingRef !== null && createPortal(
        <EditModal
          open
          initialText={editingRefData?.reflection?.text || ''}
          initialImages={editingRefData?.reflection?.images}
          initialLocation={editingRefData?.reflection?.location}
          onSave={(text, images, location) => { onEditReflection(editingRef, text, images, location); setEditingRef(null); }}
          onCancel={() => setEditingRef(null)}
        />,
        document.body
      )}
      {confirmingMsg !== null && createPortal(
        <ConfirmModal
          open
          onConfirm={() => { onDeleteMessage(confirmingMsg); setConfirmingMsg(null); }}
          onCancel={() => setConfirmingMsg(null)}
        />,
        document.body
      )}
      {confirmingRef !== null && createPortal(
        <ConfirmModal
          open
          onConfirm={() => { onDeleteReflection(confirmingRef); setConfirmingRef(null); }}
          onCancel={() => setConfirmingRef(null)}
        />,
        document.body
      )}
    </>
  );
}
