import { useCallback, useMemo } from 'react';
import useNodeStore from '../../store/useNodeStore';
import useSelectionStore from '../../store/useSelectionStore';
import { useTranslation } from '../../i18n';
import { computeBaseHalfLife } from '../../engine/decay';
import DecayOverlay from './DecayOverlay';
import AtomChip from './AtomChip';
import MoleculeCard from './MoleculeCard';

export default function Canvas({ onNodeDetail }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);

  const baseHalfLife = useMemo(() => computeBaseHalfLife(), [nodes]);

  // Hide nodes that are children of any parent (they render inside their parent card)
  const topLevel = useMemo(() => {
    const childIdSet = new Set();
    for (const n of nodes) {
      for (const cid of n.childIds) childIdSet.add(cid);
    }
    return nodes.filter(n => !childIdSet.has(n.id));
  }, [nodes]);

  // Sort by createdAt descending — flex-col-reverse flips visually so newest is at bottom
  const sorted = [...topLevel].sort((a, b) => b.createdAt - a.createdAt);

  const handleSelect = useCallback((id) => {
    useSelectionStore.getState().toggle(id);
  }, []);

  const handleLongPress = useCallback((id) => {
    if (onNodeDetail) onNodeDetail(id);
  }, [onNodeDetail]);

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-3 flex flex-col-reverse">
      <div className="max-w-lg mx-auto space-y-2 w-full">
        {sorted.map(node => (
          <CanvasNode
            key={node.id}
            node={node}
            baseHalfLife={baseHalfLife}
            onSelect={handleSelect}
            onLongPress={handleLongPress}
          />
        ))}
      </div>
      {sorted.length > 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 text-center pt-2 pb-4 max-w-lg mx-auto">
          {t('canvas.hintLongPress')}
        </p>
      )}
    </div>
  );
}

function CanvasNode({ node, baseHalfLife, onSelect, onLongPress }) {
  const isSelected = useSelectionStore(s => s.selectedIds.includes(node.id));

  const handleClick = () => onSelect(node.id);
  const handleLongPress = () => onLongPress(node.id);

  const props = {
    node,
    selected: isSelected,
    onClick: handleClick,
    onLongPress: handleLongPress,
  };

  let content;
  switch (node.level) {
    case 'atom':
      content = <AtomChip {...props} />;
      break;
    case 'molecule':
      content = <MoleculeCard {...props} />;
      break;
    default:
      return null;
  }

  const align = node.level === 'atom' ? 'flex justify-end' : '';

  return (
    <div className={align}>
      <DecayOverlay node={node} baseHalfLife={baseHalfLife} sharp={isSelected}>
        {content}
      </DecayOverlay>
    </div>
  );
}
