import { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Video, MapPin, Link as LinkIcon } from 'lucide-react';
import LinkifyText from '../shared/LinkifyText';
import useNodeStore from '../../store/useNodeStore';

const DWELL_MS = 3000; // 3 seconds to count as a "read"

export default function AtomChip({
  node,
  selected = false,
  onClick,
  onLongPress,
  /** When true, text atoms require tap to reveal. Default true. */
  revealable = true,
  /** When false, skip the tap-to-reveal + dwell interaction entirely (e.g. onboarding). */
  interactive = true,
}) {
  const [revealed, setRevealed] = useState(!revealable || node.type !== 'text');
  const dwellTimerRef = useRef(null);
  const strengthenAtom = useNodeStore((s) => s.strengthenAtom);

  // Reset revealed state when revealable changes (e.g. navigating away in stack)
  useEffect(() => {
    if (revealable && node.type === 'text') {
      setRevealed(false);
    }
  }, [revealable, node.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dwell timer: 3s after reveal → strengthen
  useEffect(() => {
    if (!interactive) return;
    if (revealed && node.type === 'text') {
      dwellTimerRef.current = setTimeout(() => {
        strengthenAtom(node.id);
      }, DWELL_MS);
      return () => clearTimeout(dwellTimerRef.current);
    }
  }, [revealed, interactive, node.id, node.type, strengthenAtom]);

  // For non-text atoms (photo, music, etc.), start dwell on mount
  useEffect(() => {
    if (!interactive || node.type === 'text') return;
    dwellTimerRef.current = setTimeout(() => {
      strengthenAtom(node.id);
    }, DWELL_MS);
    return () => clearTimeout(dwellTimerRef.current);
  }, [interactive, node.id, node.type, strengthenAtom]);

  const handleReveal = useCallback((e) => {
    if (!interactive || revealed || node.type !== 'text') return;
    e.stopPropagation();
    setRevealed(true);
  }, [interactive, revealed, node.type]);

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

  // Text atoms: tap to reveal instead of normal click when not yet revealed
  const handleClick = (e) => {
    if (interactive && !revealed && node.type === 'text') {
      handleReveal(e);
      return;
    }
    if (onClick) onClick();
  };

  const needsReveal = interactive && revealable && node.type === 'text' && !revealed;

  return (
    <div
      role={onClick || needsReveal ? 'button' : undefined}
      tabIndex={onClick || needsReveal ? 0 : undefined}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onKeyDown={(onClick || needsReveal) ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); }
      } : undefined}
      className={`inline-block max-w-full overflow-hidden rounded-xl transition-all ${
        onClick || needsReveal ? 'cursor-pointer select-none' : ''
      } ${
        selected
          ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-stone-900'
          : ''
      } bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm`}
    >
      <AtomContent node={node} blurred={needsReveal} />
    </div>
  );
}

function AtomContent({ node, blurred = false }) {
  const padding = 'px-3 py-2';

  // Interaction blur for text: used only inside molecule gallery (interactive mode)
  const blurStyle = blurred
    ? { filter: 'blur(2px)', opacity: 0.65, transition: 'filter 0.3s, opacity 0.3s' }
    : { transition: 'filter 0.3s, opacity 0.3s' };

  switch (node.type) {
    case 'text':
      return (
        <p
          className={`${padding} text-stone-700 dark:text-stone-300 text-sm leading-relaxed`}
          style={blurStyle}
        >
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
