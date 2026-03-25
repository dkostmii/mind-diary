import { useTranslation } from '../../i18n';
import { computeWeeklySummary } from '../../utils/streak';
import useMessageStore from '../../store/useMessageStore';
import useFragmentStore from '../../store/useFragmentStore';
import useReflectionStore from '../../store/useReflectionStore';
import useUserStore from '../../store/useUserStore';
import { getPoolStats } from '../../engine/poolStats';
import { isThisWeek } from 'date-fns';

export default function WeeklySummary() {
  const { t } = useTranslation();
  const messages = useMessageStore((s) => s.messages);
  const fragments = useFragmentStore((s) => s.fragments);
  const reflections = useReflectionStore((s) => s.reflections);
  const weekStartDay = useUserStore((s) => s.preferences.weekStartDay);

  const summary = computeWeeklySummary(messages, weekStartDay);
  const stats = getPoolStats(fragments);

  const fragmentsThisWeek = fragments.filter((f) =>
    isThisWeek(new Date(f.createdAt), { weekStartsOn: weekStartDay === 'monday' ? 1 : 0 })
  ).length;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
        {t('summary.title')}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('summary.entriesThisWeek')} value={summary.entriesThisWeek} />
        <StatCard
          label={t('summary.streak')}
          value={`${summary.streak} ${t('summary.days')}`}
        />
        <StatCard
          label={t('summary.fragmentsTotal')}
          value={stats.total}
          sub={fragmentsThisWeek > 0 ? t('summary.fragmentsThisWeek', { count: fragmentsThisWeek }) : null}
        />
        <StatCard label={t('summary.totalReflections')} value={reflections.length + summary.totalReflections} />
        {stats.combos > 0 && (
          <StatCard
            label={t('summary.possibleCombos')}
            value={stats.combos >= 1000 ? `${Math.floor(stats.combos / 1000)}k+` : stats.combos}
            wide
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, wide }) {
  return (
    <div className={`rounded-xl bg-stone-100 dark:bg-stone-800 p-3 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{sub}</p>}
    </div>
  );
}
