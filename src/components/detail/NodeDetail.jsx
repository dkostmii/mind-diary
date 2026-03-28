import { useRef, useState, useEffect } from 'react';
import { X, Ungroup, Minus, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from '../../i18n';
import { getDecay } from '../../engine/decay';
import useNodeStore from '../../store/useNodeStore';
import AtomChip from '../canvas/AtomChip';
import ImageThumbnails from '../shared/ImageThumbnails';
import LocationButton from '../shared/LocationButton';
import LinkifyText, { MediaLink } from '../shared/LinkifyText';

export default function NodeDetail({ nodeId, onClose, onAddHere, readOnly = false }) {
  const { t } = useTranslation();
  const nodes = useNodeStore((s) => s.nodes);
  const removeNode = useNodeStore((s) => s.removeNode);
  const dissolveMolecule = useNodeStore((s) => s.dissolveMolecule);
  const removeChildFromNode = useNodeStore((s) => s.removeChildFromNode);
  const tickOtherAtoms = useNodeStore((s) => s.tickOtherAtoms);
  const strengthenAtom = useNodeStore((s) => s.strengthenAtom);
  const backdropRef = useRef(null);
  const pointerDownTarget = useRef(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [childDetailId, setChildDetailId] = useState(null);
  const initialPercentRef = useRef(null);
  const [animated, setAnimated] = useState(false);

  const node = nodes.find(n => n.id === nodeId);

  // Auto-close when the node is deleted (e.g. after dissolve)
  useEffect(() => {
    if (!node && !fadingOut) onClose();
  }, [node, fadingOut, onClose]);

  // Strengthen after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const n = useNodeStore.getState().nodes.find(x => x.id === nodeId);
      if (!n) return;
      const kids = (n.childIds || [])
        .map(cid => useNodeStore.getState().nodes.find(x => x.id === cid))
        .filter(Boolean);
      if (n.level === 'atom') {
        strengthenAtom(n.id);
      } else {
        for (const c of kids) {
          if (c.level === 'atom') strengthenAtom(c.id);
        }
      }
      setTimeout(() => setAnimated(true), 50);
    }, 300);
    return () => clearTimeout(timer);
  }, [nodeId, strengthenAtom]);

  if (!node) return null;

  const children = (node.childIds || [])
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean);

  const created = format(new Date(node.createdAt), 'dd.MM.yyyy HH:mm');
  const isMolecule = node.level === 'molecule';

  const { retention } = getDecay(node, nodes);
  const percent = Math.round(retention * 100);

  // Capture initial percent on first render
  if (initialPercentRef.current === null) {
    initialPercentRef.current = percent;
  }

  // Before animation kicks in, show the frozen initial value; after, show live percent
  const shownPercent = animated ? percent : initialPercentRef.current;

  const safeIndex = Math.min(galleryIndex, Math.max(0, children.length - 1));
  const currentChild = children[safeIndex];

  const navigateGallery = (dir) => {
    setGalleryIndex(prev => {
      const next = prev + dir;
      if (next < 0 || next >= children.length) return prev;
      // Navigating = interaction tick
      const target = children[next];
      if (target) tickOtherAtoms([target.id]);
      return next;
    });
  };

  const handleDissolve = async () => {
    await dissolveMolecule(node.id);
    onClose();
  };

  const handleDissolveAtom = () => {
    setFadingOut(true);
    setTimeout(async () => {
      await removeNode(node.id);
      onClose();
    }, 600);
  };

  const handleRemoveChild = async (childId) => {
    await removeChildFromNode(node.id, childId);
    if (safeIndex >= children.length - 1 && safeIndex > 0) {
      setGalleryIndex(safeIndex - 1);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onPointerDown={(e) => { pointerDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === backdropRef.current && pointerDownTarget.current === backdropRef.current) onClose();
        pointerDownTarget.current = null;
      }}
    >
      <div
        className="bg-stone-50 dark:bg-stone-800 rounded-2xl shadow-xl w-full max-w-lg p-4 pb-6 space-y-4 max-h-[80vh] flex flex-col select-none"
        style={{
          opacity: fadingOut ? 0 : 1,
          filter: fadingOut ? 'blur(8px)' : 'none',
          transition: 'opacity 0.6s ease, filter 0.6s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {t(`levels.${node.level}`)}
            </span>
            <p className="text-xs text-stone-400 mt-0.5">
              {t('detail.created', { date: created })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${shownPercent}%`,
                    backgroundColor: shownPercent > 50 ? '#22c55e' : shownPercent > 20 ? '#eab308' : '#ef4444',
                    transition: 'width 0.8s ease-out, background-color 0.8s ease-out',
                  }}
                />
              </div>
              <span className="text-xs text-stone-400 whitespace-nowrap">
                {t('detail.retention', { percent: shownPercent })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {node.level === 'atom' ? (
            <div className="flex items-center justify-center min-h-[120px]">
              <AtomDetailContent node={node} />
            </div>
          ) : (
            /* Molecule gallery: one atom at a time, centered */
            <div className="flex flex-col items-center gap-3 min-h-[120px] justify-center">
              {currentChild && (
                <div className="w-full flex items-center justify-center">
                  <AtomChip
                    node={currentChild}
                    revealable={false}
                    interactive={false}
                    onClick={() => {
                      strengthenAtom(currentChild.id);
                      setChildDetailId(currentChild.id);
                    }}
                  />
                </div>
              )}

              {/* Gallery navigation */}
              {children.length > 1 && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateGallery(-1)}
                    disabled={safeIndex === 0}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 disabled:opacity-20 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                    {safeIndex + 1} / {children.length}
                  </span>
                  <button
                    onClick={() => navigateGallery(1)}
                    disabled={safeIndex === children.length - 1}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 disabled:opacity-20 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

              {/* Remove atom button for current child */}
              {!readOnly && isMolecule && children.length > 2 && currentChild && (
                <button
                  onClick={() => handleRemoveChild(currentChild.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Minus size={12} />
                  {t('detail.removeAtom')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!readOnly && <div className="shrink-0 flex flex-col gap-2">
          {isMolecule && (
            <button
              onClick={handleDissolve}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Ungroup size={16} />
              {t('detail.dissolve')}
            </button>
          )}
          {node.level === 'atom' && (
            <button
              onClick={handleDissolveAtom}
              disabled={fadingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-600 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
            >
              <Flame size={16} />
              {t('detail.dissolveAtom')}
            </button>
          )}
        </div>}
      </div>

      {/* Nested atom detail when tapping an atom in molecule gallery */}
      {childDetailId && (
        <NodeDetail
          nodeId={childDetailId}
          onClose={() => setChildDetailId(null)}
          onAddHere={onAddHere}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function AtomDetailContent({ node }) {
  switch (node.type) {
    case 'photo':
      return <ImageThumbnails images={[node.content.data]} />;

    case 'location':
      return <LocationButton location={node.content} />;

    case 'music':
    case 'video':
      if (node.content.url) {
        return <MediaLink url={node.content.url} />;
      }
      return <AtomChip node={node} interactive={false} />;

    case 'link':
      return (
        <a
          href={node.content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 dark:text-indigo-400 underline break-all"
        >
          {node.content.title || node.content.url}
        </a>
      );

    default:
      return <AtomChip node={node} interactive={false} />;
  }
}
