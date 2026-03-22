import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { MAPBOX_TOKEN } from '../../utils/mapbox';

let mapboxgl = null;

async function loadMapbox() {
  if (!mapboxgl) {
    const mod = await import('mapbox-gl');
    mapboxgl = mod.default;
    await import('mapbox-gl/dist/mapbox-gl.css');
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }
  return mapboxgl;
}

export default function LocationViewModal({ location, open, onClose }) {
  const { t } = useTranslation();
  const mapContainer = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !location) return;
    setLoading(true);

    let map;
    let cancelled = false;

    (async () => {
      const mb = await loadMapbox();
      if (cancelled) return;

      map = new mb.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location.lng, location.lat],
        zoom: 14,
        interactive: true,
      });

      new mb.Marker({ color: '#4f46e5' })
        .setLngLat([location.lng, location.lat])
        .addTo(map);

      map.on('load', () => {
        if (!cancelled) setLoading(false);
      });
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [open, location]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !location) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl mx-4 w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">
              {location.name || t('common.somePlace')}
            </p>
            {location.description && location.description !== location.name && (
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {location.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative w-full h-64 sm:h-80">
          <div ref={mapContainer} className="w-full h-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-800">
              <span className="text-stone-400 animate-pulse">Loading map...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
