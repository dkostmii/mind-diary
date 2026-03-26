import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import useNodeStore from '../../store/useNodeStore';
import useSelectionStore from '../../store/useSelectionStore';
import AtomChip from '../canvas/AtomChip';

export default function LinkSheet({ open, parentId, onClose }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);
  const addChildrenToNode = useNodeStore((s) => s.addChildrenToNode);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const clear = useSelectionStore((s) => s.clear);
  const toggle = useSelectionStore((s) => s.toggle);
  const backdropRef = useRef(null);
  const pointerDownTarget = useRef(null);

  const parent = nodes.find(n => n.id === parentId);
  const existingChildIds = new Set(parent?.childIds || []);

  // Available nodes to link (not already children, not the parent itself)
  const available = nodes.filter(n =>
    n.id !== parentId &&
    !existingChildIds.has(n.id) &&
    (parent?.level === 'story' || n.level === 'atom')
  );

  useEffect(() => {
    if (!open) clear();
  }, [open, clear]);

  const handleLink = async () => {
    if (selectedIds.length === 0) return;
    await addChildrenToNode(parentId, selectedIds);
    clear();
    onClose();
  };

  if (!open || !parent) return null;

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
      <div className="bg-white dark:bg-stone-800 rounded-t-2xl shadow-xl w-full max-w-lg p-4 pb-6 space-y-4 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {t('detail.addHere')}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('combine.cancel')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col items-start gap-2 py-1">
          {available.map(node => (
            <AtomChip
              key={node.id}
              node={node}
              selected={selectedIds.includes(node.id)}
              onClick={() => toggle(node.id)}
            />
          ))}
          {available.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-4 w-full">
              {t('canvas.emptyState')}
            </p>
          )}
        </div>

        <button
          onClick={handleLink}
          disabled={selectedIds.length === 0}
          className="shrink-0 w-full px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          {t('detail.addHere')}{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </button>
      </div>
    </div>
  );
}
