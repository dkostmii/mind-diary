import { Music, Video, MapPin, Link as LinkIcon } from 'lucide-react';
import LinkifyText from '../shared/LinkifyText';

export default function AtomChip({ node, selected = false, onClick, onLongPress }) {
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
      className={`inline-block max-w-full overflow-hidden rounded-xl transition-all ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${
        selected
          ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-stone-900'
          : ''
      } bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm`}
    >
      <AtomContent node={node} />
    </div>
  );
}

function AtomContent({ node }) {
  const padding = 'px-3 py-2';

  switch (node.type) {
    case 'text':
      return (
        <p className={`${padding} text-stone-700 dark:text-stone-300 text-sm leading-relaxed`}>
          <LinkifyText>{node.content.excerpt}</LinkifyText>
        </p>
      );

    case 'photo':
      return (
        <div className={padding}>
          <img
            src={node.content.data}
            alt=""
            className="w-16 h-16 rounded-lg object-cover border border-stone-200 dark:border-stone-700 pointer-events-none"
          />
        </div>
      );

    case 'location':
      return (
        <div className={`${padding} flex items-center gap-1.5 overflow-hidden text-stone-600 dark:text-stone-400`}>
          <MapPin size={14} className="text-indigo-500 shrink-0" />
          <span className="text-sm truncate">{node.content.name || 'Location'}</span>
        </div>
      );

    case 'music':
      return (
        <div className={`${padding} flex items-center gap-2 overflow-hidden text-stone-600 dark:text-stone-400`}>
          <Music size={14} className="text-[#1DB954] shrink-0" />
          <span className="text-sm truncate">{node.content.label || node.content.title || 'Music'}</span>
        </div>
      );

    case 'video':
      return (
        <div className={`${padding} flex items-center gap-2 overflow-hidden text-stone-600 dark:text-stone-400`}>
          <Video size={14} className="text-red-500 shrink-0" />
          <span className="text-sm truncate">{node.content.label || node.content.title || 'Video'}</span>
        </div>
      );

    case 'link':
      return (
        <div className={`${padding} flex items-center gap-1.5 overflow-hidden text-stone-600 dark:text-stone-400`}>
          <LinkIcon size={14} className="text-indigo-500 shrink-0" />
          <span className="text-sm text-indigo-600 dark:text-indigo-400 truncate">
            {node.content.title || node.content.url}
          </span>
        </div>
      );

    default:
      return (
        <p className={`${padding} text-stone-400 text-sm`}>{node.type}</p>
      );
  }
}
