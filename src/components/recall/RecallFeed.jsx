import { useState } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { FragmentContent } from '../reflect/FragmentCard';
import ConfirmModal from '../shared/ConfirmModal';
import LinkifyText from '../shared/LinkifyText';
import ImageThumbnails from '../shared/ImageThumbnails';
import LocationButton from '../shared/LocationButton';

export default function RecallFeed({ reflections, fragmentsById, onDelete }) {
  const { t, lang } = useTranslation();
  const [confirming, setConfirming] = useState(null);
  const locale = lang === 'uk' ? { locale: uk } : {};

  return (
    <>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4 max-w-7xl mx-auto">
          {reflections.map((reflection) => {
            const fragments = reflection.fragmentIds
              .map((id) => fragmentsById.get(id))
              .filter(Boolean);
            const dateStr = format(new Date(reflection.createdAt), 'd MMM yyyy HH:mm', locale);
            const hasReflectionContent =
              reflection.text || reflection.images?.length > 0 || reflection.location;

            return (
              <div
                key={reflection.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 p-4 shadow-sm flex flex-col"
              >
                {/* Merged fragment contents */}
                <div className="space-y-3">
                  {fragments.map((f) => (
                    <div key={f.id}>
                      <FragmentContent fragment={f} t={t} />
                    </div>
                  ))}
                </div>

                {/* Reflection content */}
                {hasReflectionContent && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700">
                    {reflection.text && (
                      <p className="text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words mb-2 text-sm">
                        <LinkifyText>{reflection.text}</LinkifyText>
                      </p>
                    )}
                    <ImageThumbnails images={reflection.images} />
                    <LocationButton location={reflection.location} />
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3">
                  <p className="text-xs text-stone-400 dark:text-stone-500">{dateStr}</p>
                  <button
                    onClick={() => setConfirming(reflection.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {confirming !== null && createPortal(
        <ConfirmModal
          open
          onConfirm={() => { onDelete(confirming); setConfirming(null); }}
          onCancel={() => setConfirming(null)}
        />,
        document.body
      )}
    </>
  );
}
