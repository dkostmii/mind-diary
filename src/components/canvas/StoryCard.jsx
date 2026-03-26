import AtomChip from './AtomChip';
import MoleculeCard from './MoleculeCard';
import useNodeStore from '../../store/useNodeStore';

export default function StoryCard({ node, selected = false, onClick, onLongPress }) {
  const allNodes = useNodeStore((s) => s.nodes);
  const children = node.childIds
    .map(id => allNodes.find(n => n.id === id))
    .filter(Boolean);

  const handlePointerDown = (e) => {
    if (!onLongPress) return;
    const timer = setTimeout(() => {
      onLongPress();
    }, 500);
    const cancel = () => {
      clearTimeout(timer);
      e.target.removeEventListener('pointerup', cancel);
      e.target.removeEventListener('pointerleave', cancel);
      e.target.removeEventListener('pointermove', onMove);
    };
    const onMove = (ev) => {
      if (Math.abs(ev.movementX) > 5 || Math.abs(ev.movementY) > 5) cancel();
    };
    e.target.addEventListener('pointerup', cancel, { once: true });
    e.target.addEventListener('pointerleave', cancel, { once: true });
    e.target.addEventListener('pointermove', onMove);
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      } : undefined}
      className={`rounded-2xl bg-stone-50 dark:bg-stone-850 border-2 p-4 shadow-md transition-all ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${
        selected
          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30'
          : 'border-stone-300 dark:border-stone-600'
      }`}
    >
      {node.note && (
        <p className="text-sm text-stone-600 dark:text-stone-300 mb-3 italic font-medium">
          {node.note}
        </p>
      )}
      <div className="space-y-2">
        {children.map(child => {
          if (child.level === 'molecule') {
            return <MoleculeCard key={child.id} node={child} />;
          }
          return <AtomChip key={child.id} node={child} compact />;
        })}
      </div>
    </div>
  );
}
