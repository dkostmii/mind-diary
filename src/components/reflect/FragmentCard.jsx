import { Music, Video } from 'lucide-react';
import { useTranslation } from '../../i18n';
import LinkifyText, { MediaLink } from '../shared/LinkifyText';
import ImageThumbnails from '../shared/ImageThumbnails';
import LocationButton from '../shared/LocationButton';

export default function FragmentCard({ fragment, selected = false, onClick }) {
  const { t } = useTranslation();

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      } : undefined}
      className={`rounded-2xl bg-white dark:bg-stone-800 border p-4 shadow-sm transition-all ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${
        selected
          ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30'
          : 'border-stone-200 dark:border-stone-700'
      }`}
    >
      <FragmentContent fragment={fragment} t={t} />
    </div>
  );
}

export function FragmentContent({ fragment, t }) {
  switch (fragment.type) {
    case 'text':
      return (
        <p className="text-stone-700 dark:text-stone-300 text-base leading-relaxed italic" onClick={(e) => { if (e.target !== e.currentTarget) e.stopPropagation(); }}>
          <LinkifyText>{fragment.content.excerpt}</LinkifyText>
        </p>
      );

    case 'photo':
      return (
        <div className="w-fit" onClick={(e) => e.stopPropagation()}>
          <ImageThumbnails images={[fragment.content.data]} />
        </div>
      );

    case 'location':
      return (
        <div className="w-fit" onClick={(e) => e.stopPropagation()}>
          <LocationButton location={fragment.content} />
        </div>
      );

    case 'music':
    case 'video':
      if (!fragment.content.url) {
        return (
          <div className="flex items-center gap-2 text-stone-400">
            {fragment.type === 'music' ? <Music size={18} /> : <Video size={18} />}
            <p className="text-sm">{fragment.content.label || fragment.content.title || fragment.type}</p>
          </div>
        );
      }
      return (
        <div className="w-fit" onClick={(e) => e.stopPropagation()}>
          <MediaLink url={fragment.content.url} />
        </div>
      );

    default:
      return (
        <p className="text-stone-400 text-sm">{fragment.type}</p>
      );
  }
}
