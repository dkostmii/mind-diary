import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import AtomChip from '../canvas/AtomChip';
import MoleculeCard from '../canvas/MoleculeCard';

/**
 * Demonstrates molecule dissolution visually (without actually changing store data).
 *
 * Phases:
 *  1. 'bright'   — molecule shown at full clarity
 *  2. 'fading'   — molecule fades (opacity + blur animate over 2s)
 *  3. 'dissolve' — molecule disappears, child atoms appear sharp
 */
export default function StepFade({ atoms, moleculeId, onContinue }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);
  const molecule = nodes.find(n => n.id === moleculeId);

  const [phase, setPhase] = useState('bright');

  // Auto-advance from fading → dissolve after the CSS transition finishes
  useEffect(() => {
    if (phase === 'fading') {
      const timer = setTimeout(() => setPhase('dissolve'), 2200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Start the fade animation shortly after mount
  useEffect(() => {
    const timer = setTimeout(() => setPhase('fading'), 1500);
    return () => clearTimeout(timer);
  }, []);

  const childAtoms = (molecule?.childIds || [])
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
          {t('onboarding.fadeExplain')}
        </p>

        {phase !== 'dissolve' ? (
          /* Molecule fading */
          <div
            style={{
              opacity: phase === 'fading' ? 0.12 : 1,
              filter: phase === 'fading' ? 'blur(6px)' : 'none',
              transition: 'opacity 2s ease, filter 2s ease',
            }}
          >
            {molecule && <MoleculeCard node={molecule} />}
          </div>
        ) : (
          /* Atoms released — appear sharp */
          <div
            className="flex flex-col items-start gap-2"
            style={{
              animation: 'fadeIn 0.5s ease',
            }}
          >
            {childAtoms.map(atom => (
              <AtomChip key={atom.id} node={atom} interactive={false} revealable={false} />
            ))}
          </div>
        )}

        <button
          onClick={onContinue}
          disabled={phase !== 'dissolve'}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {t('common.done')}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
