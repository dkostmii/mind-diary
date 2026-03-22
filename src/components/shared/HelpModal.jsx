import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';

const sections = [
  { emoji: '📝', nameKey: 'nav.journal', descKey: 'help.journal' },
  { emoji: '💭', nameKey: 'nav.reflect', descKey: 'help.reflect' },
  { emoji: '📖', nameKey: 'nav.recall', descKey: 'help.recall' },
  { emoji: '⚙️', nameKey: 'nav.settings', descKey: 'help.settings' },
];

export default function HelpModal({ open, onClose }) {
  const { t } = useTranslation();
  const backdropRef = useRef(null);
  const pointerDownTarget = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onPointerDown={(e) => { pointerDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === backdropRef.current && pointerDownTarget.current === backdropRef.current) onClose();
        pointerDownTarget.current = null;
      }}
    >
      <div
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl mx-4 w-full max-w-sm max-h-[80vh] flex flex-col relative"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {t('help.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6 space-y-4">
          {sections.map(({ emoji, nameKey, descKey }) => (
            <div key={nameKey}>
              <h3 className="font-medium text-stone-800 dark:text-stone-200 mb-1">
                {emoji} {t(nameKey)}
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
