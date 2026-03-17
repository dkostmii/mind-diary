import { useTranslation } from '../../i18n';
import { computeWeeklySummary } from '../../utils/streak';
import useMessageStore from '../../store/useMessageStore';
import useUserStore from '../../store/useUserStore';

export default function WeeklySummary() {
  const { t } = useTranslation();
  const messages = useMessageStore((s) => s.messages);
  const weekStartDay = useUserStore((s) => s.preferences.weekStartDay);
  const summary = computeWeeklySummary(messages, weekStartDay);

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
        <StatCard label={t('summary.totalReflections')} value={summary.totalReflections} />
        <StatCard label={t('summary.reflectionRatio')} value={`${summary.reflectionRatio}%`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3">
      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{value}</p>
      <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{label}</p>
    </div>
  );
}
