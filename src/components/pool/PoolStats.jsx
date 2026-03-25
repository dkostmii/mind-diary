import { useTranslation } from '../../i18n';
import useFragmentStore from '../../store/useFragmentStore';
import { getPoolStats } from '../../engine/poolStats';
import { isThisWeek } from 'date-fns';

export default function PoolStats() {
  const { t } = useTranslation();
  const fragments = useFragmentStore((s) => s.fragments);
  const stats = getPoolStats(fragments);

  const thisWeekCount = fragments.filter((f) =>
    isThisWeek(new Date(f.createdAt), { weekStartsOn: 1 })
  ).length;

  const typeRows = [
    { key: 'text',     labelKey: 'pool.texts' },
    { key: 'photo',    labelKey: 'pool.photos' },
    { key: 'location', labelKey: 'pool.locations' },
    { key: 'music',    labelKey: 'pool.music' },
    { key: 'video',    labelKey: 'pool.videos' },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-stone-800 p-4 shadow-sm space-y-3">
      <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
        {t('pool.title')}
      </h2>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {stats.total}
        </span>
        <span className="text-sm text-stone-500 dark:text-stone-400">
          {t('pool.total', { count: stats.total })}
        </span>
        {thisWeekCount > 0 && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            {t('pool.thisWeek', { count: thisWeekCount })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {typeRows.map(({ key, labelKey }) => {
          const count = stats.byType[key];
          if (count === 0) return null;
          return (
            <div key={key} className="text-center rounded-lg bg-stone-50 dark:bg-stone-700 p-2">
              <p className="text-base font-semibold text-stone-700 dark:text-stone-200">{count}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">{t(labelKey)}</p>
            </div>
          );
        })}
      </div>

      {stats.combos > 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500">
          {t('pool.combos', { count: stats.combos.toLocaleString() })}
        </p>
      )}
    </div>
  );
}
