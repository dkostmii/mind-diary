import { Music, Video, MapPin, Link as LinkIcon } from 'lucide-react';
import LinkifyText, { MediaLink } from '../shared/LinkifyText';
import ImageThumbnails from '../shared/ImageThumbnails';
import LocationButton from '../shared/LocationButton';

export default function AtomChip({ node, selected = false, onClick, onLongPress, compact = false }) {
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
      className={`inline-block rounded-xl transition-all ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${
        selected
          ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-stone-900'
          : ''
      } ${compact ? '' : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm'}`}
    >
      <AtomContent node={node} compact={compact} />
    </div>
  );
}

function AtomContent({ node, compact }) {
  const padding = compact ? 'px-2 py-1' : 'px-3 py-2';

  switch (node.type) {
    case 'text':
      return (
        <p className={`${padding} text-stone-700 dark:text-stone-300 text-sm leading-relaxed`} onClick={(e) => { if (e.target !== e.currentTarget) e.stopPropagation(); }}>
          <LinkifyText>{node.content.excerpt}</LinkifyText>
        </p>
      );

    case 'photo':
      return (
        <div className={padding} onClick={(e) => e.stopPropagation()}>
          <ImageThumbnails images={[node.content.data]} />
        </div>
      );

    case 'location':
      return (
        <div className={`${padding} flex items-center gap-1.5`} onClick={(e) => e.stopPropagation()}>
          <LocationButton location={node.content} />
        </div>
      );

    case 'music':
    case 'video':
      if (!node.content.url) {
        return (
          <div className={`${padding} flex items-center gap-2 text-stone-400`}>
            {node.type === 'music' ? <Music size={16} /> : <Video size={16} />}
            <span className="text-sm">{node.content.label || node.content.title || node.type}</span>
          </div>
        );
      }
      return (
        <div className={padding} onClick={(e) => e.stopPropagation()}>
          <MediaLink url={node.content.url} />
        </div>
      );

    case 'link':
      return (
        <div className={`${padding} flex items-center gap-1.5`} onClick={(e) => e.stopPropagation()}>
          <LinkIcon size={14} className="text-indigo-500 shrink-0" />
          <a
            href={node.content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 dark:text-indigo-400 underline truncate"
          >
            {node.content.title || node.content.url}
          </a>
        </div>
      );

    default:
      return (
        <p className={`${padding} text-stone-400 text-sm`}>{node.type}</p>
      );
  }
}
