import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import ImageGallery from './ImageGallery';

const MAX_IMAGES = 10;
const MAX_SIZE = 1200;

export function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= MAX_SIZE && img.height <= MAX_SIZE) {
          resolve(e.target.result);
          return;
        }
        const canvas = document.createElement('canvas');
        const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function ImagePreview({ images = [], onChange }) {
  const [galleryIndex, setGalleryIndex] = useState(null);

  if (!images.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((src, i) => (
          <div key={i} className="relative w-16 h-16">
            <button
              type="button"
              onClick={() => setGalleryIndex(i)}
              className="w-full h-full rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-stone-800 text-stone-500 hover:text-red-500 active:text-red-600 transition-colors shadow-sm border border-stone-200 dark:border-stone-600"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <ImageGallery
        images={images}
        initialIndex={galleryIndex ?? 0}
        open={galleryIndex !== null}
        onClose={() => setGalleryIndex(null)}
      />
    </>
  );
}

export function ImageAttachButton({ images = [], onChange, label, maxLabel, fullWidth }) {
  const inputRef = useRef(null);
  const atMax = images.length >= MAX_IMAGES;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toProcess = files.slice(0, remaining);

    const results = await Promise.all(toProcess.map(resizeImage));
    onChange([...images, ...results]);

    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => !atMax && inputRef.current?.click()}
        disabled={atMax}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors ${
          atMax
            ? 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
            : 'text-stone-400 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-800'
        } ${label || maxLabel ? 'px-3 py-1.5 text-sm' : 'p-2'} ${fullWidth ? 'w-full sm:w-auto' : ''}`}
        aria-label="Attach image"
      >
        <ImagePlus size={label || maxLabel ? 16 : 20} />
        {(label || maxLabel) && <span>{atMax && maxLabel ? maxLabel : label}</span>}
      </button>
    </>
  );
}

export default function ImagePicker({ images = [], onChange }) {
  return (
    <>
      <ImagePreview images={images} onChange={onChange} />
      <ImageAttachButton images={images} onChange={onChange} />
    </>
  );
}
