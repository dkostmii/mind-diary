import { useEffect, useState, useCallback } from 'react';
import useNodeStore from '../../store/useNodeStore';
import useSelectionStore from '../../store/useSelectionStore';
import DecayOverlay from './DecayOverlay';
import AtomChip from './AtomChip';
import MoleculeCard from './MoleculeCard';
import StoryCard from './StoryCard';

export default function Canvas({ onNodeDetail }) {
  const nodes = useNodeStore((s) => s.nodes);
  const [, setTick] = useState(0);

  // 60-second re-render tick for decay progression
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Sort by lastInteractedAt descending
  const sorted = [...nodes].sort((a, b) => b.lastInteractedAt - a.lastInteractedAt);

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
            onSelect={handleSelect}
            onLongPress={handleLongPress}
          />
        ))}
      </div>
    </div>
  );
}

function CanvasNode({ node, onSelect, onLongPress }) {
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
    case 'story':
      content = <StoryCard {...props} />;
      break;
    default:
      return null;
  }

  return (
    <DecayOverlay node={node}>
      {content}
    </DecayOverlay>
  );
}
