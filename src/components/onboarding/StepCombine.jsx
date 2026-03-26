import { useState } from 'react';
import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import AtomChip from '../canvas/AtomChip';

export default function StepCombine({ atoms, onComplete }) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState([]);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const combineNodes = useNodeStore((s) => s.combineNodes);

  const toggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleCombine = async () => {
    if (!showNote) {
      setShowNote(true);
      return;
    }
    const molecule = await combineNodes(selectedIds, note || null);
    if (molecule) onComplete(molecule.id);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
          {t('onboarding.combinePrompt')}
        </p>

        <div className="flex flex-wrap gap-2 justify-center">
          {atoms.map(atom => (
            <AtomChip
              key={atom.id}
              node={atom}
              selected={selectedIds.includes(atom.id)}
              onClick={() => toggle(atom.id)}
            />
          ))}
        </div>

        {showNote && (
          <>
            <p className="text-sm text-stone-600 dark:text-stone-400 text-center">
              {t('onboarding.moleculeExplain')}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('combine.notePlaceholder')}
              rows={2}
              className="w-full resize-none rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2.5 text-sm text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </>
        )}

        <button
          onClick={handleCombine}
          disabled={selectedIds.length < 2}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          {t('combine.confirm')}
        </button>
      </div>
    </div>
  );
}
