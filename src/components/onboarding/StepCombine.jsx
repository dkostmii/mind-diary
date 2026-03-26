import { useState, useCallback } from 'react';
import { Combine } from 'lucide-react';
import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import AtomChip from '../canvas/AtomChip';
import MoleculeCard from '../canvas/MoleculeCard';
import SharedComposer from '../shared/Composer';

export default function StepCombine({ items, prompt, onComplete }) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const combineNodes = useNodeStore((s) => s.combineNodes);
  const nodes = useNodeStore((s) => s.nodes);

  const toggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleCombineClick = () => {
    if (!showComposer) {
      setShowComposer(true);
      return;
    }
  };

  const handleSubmit = useCallback(async (text, images, location) => {
    const attachments = [];
    for (const img of (images || [])) {
      attachments.push({ type: 'photo', data: img });
    }
    if (location) {
      attachments.push({ type: 'location', name: location.name || '', lat: location.lat, lng: location.lng });
    }
    const molecule = await combineNodes(selectedIds, text || null, attachments);
    if (molecule) onComplete(molecule.id);
  }, [combineNodes, selectedIds, onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 text-center leading-relaxed">
          {prompt}
        </p>

        <div className="flex flex-col items-start gap-2">
          {items.map(item => {
            const node = nodes.find(n => n.id === item.id) || item;
            if (node.level === 'molecule' || node.level === 'story') {
              return (
                <div
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(node.id); }
                  }}
                  className={`w-full cursor-pointer select-none rounded-2xl transition-all ${
                    selectedIds.includes(node.id)
                      ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-stone-900'
                      : ''
                  }`}
                >
                  <MoleculeCard node={node} />
                </div>
              );
            }
            return (
              <AtomChip
                key={node.id}
                node={node}
                selected={selectedIds.includes(node.id)}
                onClick={() => toggle(node.id)}
              />
            );
          })}
        </div>

        {showComposer ? (
          <SharedComposer
            placeholder={t('combine.notePlaceholder')}
            buttonLabel={t('combine.confirm')}
            buttonIcon={Combine}
            onSubmit={handleSubmit}
            allowEmpty
          />
        ) : (
          <button
            onClick={handleCombineClick}
            disabled={selectedIds.length < 2}
            className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            {t('combine.confirm')}
          </button>
        )}
      </div>
    </div>
  );
}
