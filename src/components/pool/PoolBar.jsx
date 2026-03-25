import { useTranslation } from '../../i18n';
import useFragmentStore from '../../store/useFragmentStore';
import { getPoolStats } from '../../engine/poolStats';

const TYPE_COLORS = {
  text:     'bg-indigo-400',
  photo:    'bg-emerald-400',
  location: 'bg-amber-400',
  music:    'bg-pink-400',
  video:    'bg-purple-400',
};

export default function PoolBar() {
  const { t } = useTranslation();
  const fragments = useFragmentStore((s) => s.fragments);
  const stats = getPoolStats(fragments);

  if (stats.total === 0) return null;

  const types = Object.entries(stats.byType).filter(([, count]) => count > 0);

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-700"
      title={t('pool.total', { count: stats.total })}
    >
      <div className="flex gap-0.5 items-end h-3">
        {types.map(([type, count]) => {
          const heightPercent = Math.max(30, Math.min(100, (count / stats.total) * 100 * 3));
          return (
            <div
              key={type}
              className={`w-1 rounded-sm ${TYPE_COLORS[type] || 'bg-stone-400'}`}
              style={{ height: `${heightPercent}%` }}
            />
          );
        })}
      </div>
      <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
        {stats.total}
      </span>
    </div>
  );
}
