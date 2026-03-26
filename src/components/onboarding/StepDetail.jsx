import { useState } from 'react';
import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import MoleculeCard from '../canvas/MoleculeCard';
import NodeDetail from '../detail/NodeDetail';

export default function StepDetail({ moleculeId, onComplete }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);
  const [opened, setOpened] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const molecule = nodes.find(n => n.id === moleculeId);
  if (!molecule) return null;

  const handleLongPress = () => {
    setDetailOpen(true);
    setOpened(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
          {t('onboarding.detailPrompt')}
        </p>

        <MoleculeCard node={molecule} onLongPress={handleLongPress} />

        {opened && (
          <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
            {t('onboarding.detailExplain')}
          </p>
        )}

        <button
          onClick={onComplete}
          disabled={!opened}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          {t('common.done')}
        </button>
      </div>

      {detailOpen && (
        <NodeDetail
          nodeId={moleculeId}
          onClose={() => setDetailOpen(false)}
          onAddHere={() => {}}
        />
      )}
    </div>
  );
}
