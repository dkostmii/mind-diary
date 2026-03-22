import { useState } from 'react';
import ImageGallery from './ImageGallery';

export default function ImageThumbnails({ images }) {
  const [galleryIndex, setGalleryIndex] = useState(null);

  if (!images?.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setGalleryIndex(i)}
            className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
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
