import { Shuffle } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function ShuffleButton({ onShuffle, disabled }) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onShuffle}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 dark:border-stone-600 text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Shuffle size={14} />
      {t('reflect.shuffle')}
    </button>
  );
}
