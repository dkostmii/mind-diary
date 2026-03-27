import { useTranslation } from '../../i18n';

export default function StepDone({ onStart }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
          {t('onboarding.doneMessage')}
        </h2>
        <button
          onClick={onStart}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          {t('onboarding.start')}
        </button>
      </div>
    </div>
  );
}
