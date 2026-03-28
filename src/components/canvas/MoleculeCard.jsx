import AtomChip from './AtomChip';
import useNodeStore from '../../store/useNodeStore';

/**
 * Renders a molecule as 3 layered atom chips in the feed.
 * Always shows exactly 3 stacked layers regardless of actual child count.
 * No interactivity inside — that happens in NodeDetail's gallery view.
 */
export default function MoleculeCard({ node, selected = false, onClick, onLongPress }) {
  const allNodes = useNodeStore((s) => s.nodes);
  const children = node.childIds
    .map(id => allNodes.find(n => n.id === id))
    .filter(Boolean);

  // Prioritize text/photo/link for the top card so the stack is informative
  const typePriority = { text: 0, photo: 1, link: 2, location: 3, music: 4, video: 5 };
  const top = [...children].sort(
    (a, b) => (typePriority[a.type] ?? 9) - (typePriority[b.type] ?? 9)
  )[0];

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
      className={`relative inline-block max-w-full transition-all ${
        onClick ? 'cursor-pointer select-none' : ''
      }`}
      style={{ marginBottom: 8 }}
    >
      {/* Top card — renders first to establish size for the relative container */}
      <div className={`relative flex ${
        selected ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-stone-900 rounded-xl' : ''
      }`} style={{ zIndex: 2 }}>
        {top && (
          <AtomChip node={top} interactive={false} revealable={false} />
        )}
      </div>
      {/* Layer 2 (middle) */}
      <div
        className="absolute inset-0 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700"
        style={{ transform: 'translate(3px, 3px)', zIndex: 1 }}
      />
      {/* Layer 3 (back) */}
      <div
        className="absolute inset-0 rounded-xl bg-stone-100 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600"
        style={{ transform: 'translate(6px, 6px)', zIndex: 0 }}
      />
    </div>
  );
}
