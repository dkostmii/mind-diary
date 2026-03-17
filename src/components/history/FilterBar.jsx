import { useTranslation } from '../../i18n';

const FILTERS = ['all', 'unreflected', 'reflected'];

export default function FilterBar({ active, onChange }) {
  const { t } = useTranslation();

  const labels = {
    all: t('history.filterAll'),
    unreflected: t('history.filterUnreflected'),
    reflected: t('history.filterReflected'),
  };

  return (
    <div className="flex gap-2 px-4 py-2">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            active === filter
              ? 'bg-indigo-600 text-white'
              : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
          }`}
        >
          {labels[filter]}
        </button>
      ))}
    </div>
  );
}
