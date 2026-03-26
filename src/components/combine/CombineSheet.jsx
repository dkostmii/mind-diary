import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import useSelectionStore from '../../store/useSelectionStore';
import AtomChip from '../canvas/AtomChip';

export default function CombineSheet({ open, onClose }) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const clear = useSelectionStore((s) => s.clear);
  const nodes = useNodeStore((s) => s.nodes);
  const combineNodes = useNodeStore((s) => s.combineNodes);
  const backdropRef = useRef(null);
  const pointerDownTarget = useRef(null);

  const selectedNodes = selectedIds
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean);

  // Determine result type
  const hasNonAtom = selectedNodes.some(n => n.level !== 'atom');
  const resultLabel = hasNonAtom ? t('combine.resultStory') : t('combine.resultMolecule');

  useEffect(() => {
    if (!open) setNote('');
  }, [open]);

  const handleCombine = async () => {
    await combineNodes(selectedIds, note || null);
    clear();
    onClose();
  };

  if (!open) return null;

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
      <div className="bg-white dark:bg-stone-800 rounded-t-2xl shadow-xl w-full max-w-lg p-4 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {resultLabel}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('combine.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview of selected items */}
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {selectedNodes.map(node => (
            <AtomChip key={node.id} node={node} compact />
          ))}
        </div>

        {/* Note input */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('combine.notePlaceholder')}
          rows={2}
          className="w-full resize-none rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2.5 text-sm text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            {t('combine.cancel')}
          </button>
          <button
            onClick={handleCombine}
            className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {t('combine.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
