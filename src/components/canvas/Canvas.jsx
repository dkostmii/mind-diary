import { useCallback, useMemo } from 'react';
import useNodeStore from '../../store/useNodeStore';
import useSelectionStore from '../../store/useSelectionStore';
import { computeBaseHalfLife } from '../../engine/decay';
import DecayOverlay from './DecayOverlay';
import AtomChip from './AtomChip';
import MoleculeCard from './MoleculeCard';

export default function Canvas({ onNodeDetail }) {
  const nodes = useNodeStore((s) => s.nodes);

  const baseHalfLife = useMemo(() => computeBaseHalfLife(nodes), [nodes]);

  // Hide nodes that are children of any parent (they render inside their parent card)
  const topLevel = useMemo(() => {
    const childIdSet = new Set();
    for (const n of nodes) {
      for (const cid of n.childIds) childIdSet.add(cid);
    }
    return nodes.filter(n => !childIdSet.has(n.id));
  }, [nodes]);

  // Sort by lastInteractedAt descending
  const sorted = [...topLevel].sort((a, b) => b.lastInteractedAt - a.lastInteractedAt);

  const handleSelect = useCallback((id) => {
    useSelectionStore.getState().toggle(id);
  }, []);

  const handleLongPress = useCallback((id) => {
    if (onNodeDetail) onNodeDetail(id);
  }, [onNodeDetail]);

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-3">
      <div className="max-w-lg mx-auto space-y-2">
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
    case 'story':
      content = <MoleculeCard {...props} />;
      break;
    default:
      return null;
  }

  return (
    <DecayOverlay node={node} baseHalfLife={baseHalfLife}>
      {content}
    </DecayOverlay>
  );
}
