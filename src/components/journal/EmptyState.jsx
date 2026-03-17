import { useTranslation } from '../../i18n';

export default function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <p className="text-stone-400 dark:text-stone-500 text-center text-lg">
        {t('journal.emptyState')}
      </p>
    </div>
  );
}
