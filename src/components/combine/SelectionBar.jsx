import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import useSelectionStore from '../../store/useSelectionStore';

export default function SelectionBar({ onCombine }) {
  const { t } = useTranslation();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const clear = useSelectionStore((s) => s.clear);

  if (selectedIds.length < 2) return null;

  return (
    <div className="shrink-0 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-4 py-2.5">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <span className="text-sm text-stone-600 dark:text-stone-400">
          {t('combine.selected', { count: selectedIds.length })}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onCombine}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {t('combine.title')}
          </button>
          <button
            onClick={clear}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('combine.cancel')}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
