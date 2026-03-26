import { useTranslation } from '../../i18n';
import AtomChip from '../canvas/AtomChip';

export default function StepAtoms({ atoms, onContinue }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
          {t('onboarding.atomsExplain')}
        </p>

        <div className="flex flex-wrap gap-2 justify-center">
          {atoms.map(atom => (
            <AtomChip key={atom.id} node={atom} />
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          {t('common.done')}
        </button>
      </div>
    </div>
  );
}
