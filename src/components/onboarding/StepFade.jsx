import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import AtomChip from '../canvas/AtomChip';
import MoleculeCard from '../canvas/MoleculeCard';

export default function StepFade({ atoms, moleculeId, onContinue }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);
  const molecule = nodes.find(n => n.id === moleculeId);

  // Atoms NOT in the molecule get dimmed (simulate decay)
  const moleculeChildIds = new Set(molecule?.childIds || []);
  const uncombinedAtoms = atoms.filter(a => !moleculeChildIds.has(a.id));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
          {t('onboarding.fadeExplain')}
        </p>

        {/* Molecule stays bright */}
        {molecule && (
          <div className="space-y-1">
            <MoleculeCard node={molecule} />
          </div>
        )}

        {/* Uncombined atoms are dimmed */}
        {uncombinedAtoms.length > 0 && (
          <div className="flex flex-col items-start gap-2" style={{ opacity: 0.35, filter: 'blur(3px)' }}>
            {uncombinedAtoms.map(atom => (
              <AtomChip key={atom.id} node={atom} />
            ))}
          </div>
        )}

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
