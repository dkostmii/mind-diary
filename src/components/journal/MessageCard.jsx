import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import ConfirmModal from '../shared/ConfirmModal';
import EditModal from '../shared/EditModal';
import LinkifyText from '../shared/LinkifyText';
import ImageThumbnails from '../shared/ImageThumbnails';

export default function MessageCard({ message, onDelete, onEdit }) {
  const { t, lang } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
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

  return (
    <div className="group py-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-stone-500 dark:text-stone-400">{dateStr}</p>
        <div className="flex gap-1">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('common.edit')}
          >
            <Pencil size={14} />
            {t('common.edit')}
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-stone-500 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
            {t('common.delete')}
          </button>
        </div>
      </div>

      <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
        <LinkifyText>{message.text}</LinkifyText>
      </p>
      <ImageThumbnails images={message.images} />

      <EditModal
        open={editing}
        initialText={message.text}
        initialImages={message.images}
        onSave={(text, images) => { onEdit(message.id, text, images); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
      <ConfirmModal
        open={confirming}
        onConfirm={() => { setConfirming(false); onDelete(message.id); }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
