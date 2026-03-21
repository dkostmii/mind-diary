import { useEffect } from 'react';
import { useTranslation } from '../../i18n';

const sections = [
  { emoji: '📝', nameKey: 'nav.journal', descKey: 'help.journal' },
  { emoji: '💭', nameKey: 'nav.reflect', descKey: 'help.reflect' },
  { emoji: '📖', nameKey: 'nav.recall', descKey: 'help.recall' },
  { emoji: '⚙️', nameKey: 'nav.settings', descKey: 'help.settings' },
];

export default function HelpModal({ open, onClose }) {
  const { t } = useTranslation();

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl mx-4 w-full max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 px-6 pt-6 pb-4">
          {t('help.title')}
        </h2>
        <div className="overflow-y-auto px-6 space-y-4">
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
        <div className="flex justify-end px-6 pt-4 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
