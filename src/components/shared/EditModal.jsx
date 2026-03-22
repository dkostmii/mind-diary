import { useEffect, useState, useCallback } from 'react';
import { X, Check, Maximize2, Minimize2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { ImagePreview, ImageAttachButton, resizeImage } from './ImagePicker';
import LocationAttachButton from './LocationAttachButton';

const MAX_IMAGES = 10;

export default function EditModal({ open, initialText, initialImages, initialLocation, onSave, onCancel }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialText || '');
  const [images, setImages] = useState(initialImages || []);
  const [location, setLocation] = useState(initialLocation || null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (open) {
      setText(initialText || '');
      setImages(initialImages || []);
      setLocation(initialLocation || null);
      setFullscreen(false);
    }
  }, [open, initialText, initialImages, initialLocation]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false);
        else onCancel();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, fullscreen, onCancel]);

  useEffect(() => {
    if (!open) return;
    const root = document.getElementById('root');
    if (root) root.setAttribute('inert', '');
    return () => {
      if (root) root.removeAttribute('inert');
    };
  }, [open]);

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
    setImages((prev) => [...prev, ...results].slice(0, MAX_IMAGES));
  }, [images.length]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = text.trim();
    const textChanged = trimmed !== initialText;
    const imagesChanged = JSON.stringify(images) !== JSON.stringify(initialImages || []);
    const locationChanged = JSON.stringify(location) !== JSON.stringify(initialLocation || null);
    if ((trimmed || images.length) && (textChanged || imagesChanged || locationChanged)) {
      onSave(trimmed, images, location);
    } else {
      onCancel();
    }
  };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-stone-50 dark:bg-stone-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setFullscreen(false)}
            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label="Exit fullscreen"
          >
            <Minimize2 size={18} />
          </button>
          <h2 className="text-sm font-medium text-stone-600 dark:text-stone-300">
            {t('common.edit')}
          </h2>
          <button
            onClick={handleSave}
            disabled={!text.trim() && !images.length}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            <Check size={14} />
            {t('common.save')}
          </button>
        </div>
        <div className="px-4 pt-2">
          <ImagePreview images={images} onChange={setImages} />
          {location && (
            <div className="mb-2">
              <LocationAttachButton location={location} onChange={setLocation} />
            </div>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          className="flex-1 resize-none bg-transparent px-4 py-3 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none text-base"
          autoFocus
        />
        <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-200 dark:border-stone-700">
          <ImageAttachButton images={images} onChange={setImages} label={t('common.attachPhoto')} maxLabel={t('common.maxPhotosReached')} />
          {!location && <LocationAttachButton location={null} onChange={setLocation} label={t('common.attachLocation')} />}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
    >
      <div
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl mx-4 w-full max-w-sm h-[80vh] p-6 relative flex flex-col"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-4">
          {t('common.edit')}
        </h2>
        <ImagePreview images={images} onChange={setImages} />
        {location && (
          <div className="mb-2">
            <LocationAttachButton location={location} onChange={setLocation} />
          </div>
        )}
        <div className="flex-1 min-h-0 flex flex-col rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 focus-within:ring-2 focus-within:ring-indigo-500 overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              }
            }}
            className="flex-1 min-h-0 w-full resize-none bg-transparent px-3 py-2 text-stone-800 dark:text-stone-200 focus:outline-none"
            autoFocus
          />
          <div className="flex justify-end px-1 pb-1">
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="p-1.5 text-stone-400 hover:text-indigo-600 transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <ImageAttachButton images={images} onChange={setImages} label={t('common.attachPhoto')} maxLabel={t('common.maxPhotosReached')} fullWidth />
          {!location && <LocationAttachButton location={null} onChange={setLocation} label={t('common.attachLocation')} fullWidth />}
        </div>
        <div className="flex gap-3 mt-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() && !images.length}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
          >
            <Check size={14} />
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
