import AtomChip from './AtomChip';
import useNodeStore from '../../store/useNodeStore';

export default function MoleculeCard({ node, selected = false, onClick, onLongPress }) {
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
      className={`rounded-2xl bg-stone-50 dark:bg-stone-800/80 border p-3 shadow-sm transition-all ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${
        selected
          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30'
          : 'border-stone-200 dark:border-stone-700'
      }`}
    >
      <div className="flex flex-col items-start gap-2">
        {children.map(child => (
          <AtomChip key={child.id} node={child} />
        ))}
      </div>
    </div>
  );
}
