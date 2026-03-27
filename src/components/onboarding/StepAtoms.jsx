import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import AtomChip from '../canvas/AtomChip';

export default function StepAtoms({ atoms, onContinue, skipFadeDemo = false }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(skipFadeDemo ? 'done' : 'show'); // 'show' → 'fading' → 'faded' → (continue) | 'done' (skip fade)

  useEffect(() => {
    if (phase === 'fading') {
      const timer = setTimeout(() => setPhase('faded'), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleContinue = () => {
    if (phase === 'show') {
      setPhase('fading');
    } else {
      onContinue();
    }
  };

  const showFadeText = phase !== 'show' && phase !== 'done';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
          {showFadeText
            ? t('onboarding.atomsFadeExplain')
            : t('onboarding.atomsExplain')}
        </p>

        <div
          className="flex flex-col items-start gap-2"
          style={{
            opacity: phase === 'faded' ? 0.12 : 1,
            filter: (phase === 'faded') ? 'blur(6px)' : 'none',
            transition: 'opacity 2s ease, filter 2s ease',
          }}
        >
          {atoms.map(atom => (
            <AtomChip key={atom.id} node={atom} />
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={phase === 'fading'}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {t('common.done')}
        </button>
      </div>
    </div>
  );
}
