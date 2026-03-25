import { useState, useRef, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';
import { ImagePreview, ImageAttachButton, resizeImage } from './ImagePicker';
import LocationAttachButton from './LocationAttachButton';
import FullscreenComposerModal from './FullscreenComposerModal';

const MAX_IMAGES = 10;

export default function Composer({ placeholder, buttonLabel, buttonIcon: Icon, onSubmit, allowEmpty = false, disabled = false }) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!allowEmpty && !trimmed && !images.length) return;
    if (disabled) return;
    onSubmit(trimmed, images, location);
    setText('');
    setImages([]);
    setLocation(null);
    setFullscreen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, images, location, onSubmit, allowEmpty, disabled]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

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

  return (
    <>
      <div className="shrink-0 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <ImagePreview images={images} onChange={setImages} />
          {location && (
            <div className="mb-2">
              <LocationAttachButton location={location} onChange={setLocation} />
            </div>
          )}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 flex items-center rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden"
              onClick={() => textareaRef.current?.focus()}
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder}
                rows={1}
                className="flex-1 resize-none bg-transparent px-4 py-2.5 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none"
                aria-label={placeholder}
              />
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                className="p-2 text-stone-400 hover:text-indigo-600 transition-colors"
                aria-label="Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
              <ImageAttachButton images={images} onChange={setImages} />
              {!location && <LocationAttachButton location={null} onChange={setLocation} />}
            </div>
            <button
              onClick={handleSend}
              disabled={disabled || (!allowEmpty && !text.trim() && !images.length)}
              className="rounded-xl bg-indigo-600 p-2.5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
              aria-label={buttonLabel}
            >
              <Icon size={20} />
            </button>
          </div>
        </div>
      </div>
      <FullscreenComposerModal
        open={fullscreen}
        text={text}
        images={images}
        location={location}
        onChangeText={setText}
        onChangeImages={setImages}
        onChangeLocation={setLocation}
        onSave={handleSend}
        onClose={() => setFullscreen(false)}
        placeholder={placeholder}
        saveLabel={buttonLabel}
        saveIcon={Icon}
      />
    </>
  );
}
