import { useEffect, useRef, useCallback } from 'react';
import { Minimize2, Check } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { ImagePreview, ImageAttachButton, resizeImage } from './ImagePicker';
import LocationAttachButton from './LocationAttachButton';

const MAX_IMAGES = 10;

export default function FullscreenComposerModal({ open, text, images, location, onChangeText, onChangeImages, onChangeLocation, onSave, onClose, placeholder, saveLabel, saveIcon: SaveIcon }) {
  const { t } = useTranslation();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handlePaste = useCallback(async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageFiles = items
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (!imageFiles.length) return;

    e.preventDefault();
    const remaining = MAX_IMAGES - images.length;
    const toProcess = imageFiles.slice(0, remaining);
    const results = await Promise.all(toProcess.map(resizeImage));
    onChangeImages([...images, ...results].slice(0, MAX_IMAGES));
  }, [images, onChangeImages]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-stone-50 dark:bg-stone-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          aria-label={t('common.cancel')}
        >
          <Minimize2 size={18} />
        </button>
        <button
          onClick={onSave}
          disabled={!text.trim() && !images.length}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          {SaveIcon ? <SaveIcon size={14} /> : <Check size={14} />}
          {saveLabel}
        </button>
      </div>
      <div className="px-4 pt-2 overflow-y-auto max-h-[30vh] shrink-0">
        <ImagePreview images={images} onChange={onChangeImages} />
        {location && (
          <div className="mb-2">
            <LocationAttachButton location={location} onChange={onChangeLocation} />
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChangeText(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onSave();
          }
        }}
        placeholder={placeholder}
        className="flex-1 resize-none bg-transparent px-4 py-3 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none text-base"
      />
      <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-200 dark:border-stone-700">
        <ImageAttachButton images={images} onChange={onChangeImages} label={t('common.attachPhoto')} maxLabel={t('common.maxPhotosReached')} />
        {!location && <LocationAttachButton location={null} onChange={onChangeLocation} label={t('common.attachLocation')} />}
      </div>
    </div>
  );
}
