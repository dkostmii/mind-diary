import { useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import AtomChip from '../canvas/AtomChip';
import MoleculeCard from '../canvas/MoleculeCard';

export default function NodeDetail({ nodeId, onClose, onAddHere }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);
  const refreshNodeDecay = useNodeStore((s) => s.refreshNodeDecay);
  const backdropRef = useRef(null);
  const pointerDownTarget = useRef(null);

  const node = nodes.find(n => n.id === nodeId);

  // Viewing detail refreshes decay
  useEffect(() => {
    if (nodeId) refreshNodeDecay(nodeId);
  }, [nodeId, refreshNodeDecay]);

  if (!node) return null;

  const children = (node.childIds || [])
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean);

  const created = format(new Date(node.createdAt), 'dd.MM.yyyy HH:mm');
  const canAddHere = node.level !== 'atom';

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onPointerDown={(e) => { pointerDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === backdropRef.current && pointerDownTarget.current === backdropRef.current) onClose();
        pointerDownTarget.current = null;
      }}
    >
      <div className="bg-white dark:bg-stone-800 rounded-t-2xl shadow-xl w-full max-w-lg p-4 pb-6 space-y-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t(`levels.${node.level}`)}
            </span>
            <p className="text-xs text-stone-400 mt-0.5">
              {t('detail.created', { date: created })}
            </p>
            <p className="text-xs text-stone-400">
              {t('detail.interactions', { count: node.interactionCount })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Note */}
        {node.note && (
          <p className="text-sm text-stone-600 dark:text-stone-300 italic bg-stone-50 dark:bg-stone-900 rounded-xl px-3 py-2">
            {node.note}
          </p>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
          {node.level === 'atom' ? (
            <AtomChip node={node} />
          ) : (
            children.map(child => {
              if (child.level === 'molecule') {
                return <MoleculeCard key={child.id} node={child} />;
              }
              return <AtomChip key={child.id} node={child} />;
            })
          )}
        </div>

        {/* Add here button */}
        {canAddHere && (
          <button
            onClick={() => onAddHere(node.id)}
            className="shrink-0 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            <Plus size={16} />
            {t('detail.addHere')}
          </button>
        )}
      </div>
    </div>
  );
}
