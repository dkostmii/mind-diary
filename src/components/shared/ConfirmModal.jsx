import { useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function ConfirmModal({ open, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const cancelRef = useRef(null);
  const backdropRef = useRef(null);
  const pointerDownTarget = useRef(null);

  useEffect(() => {
    if (open && cancelRef.current) {
      cancelRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) return;
    const root = document.getElementById('root');
    if (root) root.setAttribute('inert', '');
    return () => {
      if (root) root.removeAttribute('inert');
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onPointerDown={(e) => { pointerDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === backdropRef.current && pointerDownTarget.current === backdropRef.current) onCancel();
        pointerDownTarget.current = null;
      }}
    >
      <div
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl mx-4 w-full max-w-sm p-6 relative"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-2">
          {t('common.confirmDelete')}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
          {t('common.deleteConfirmMessage')}
        </p>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Trash2 size={14} />
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
