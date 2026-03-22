import { useEffect, useRef, useState } from 'react';
import { X, LocateFixed, Check } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { MAPBOX_TOKEN, reverseGeocode, getCurrentPosition } from '../../utils/mapbox';

let mapboxgl = null;
let MapboxGeocoder = null;

async function loadMapbox() {
  if (!mapboxgl) {
    const mod = await import('mapbox-gl');
    mapboxgl = mod.default;
    await import('mapbox-gl/dist/mapbox-gl.css');
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }
  if (!MapboxGeocoder) {
    const mod = await import('@mapbox/mapbox-gl-geocoder');
    MapboxGeocoder = mod.default;
    await import('@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css');
  }
  return { mapboxgl, MapboxGeocoder };
}

const DEFAULT_CENTER = [30.5, 50.45];
const DEFAULT_ZOOM = 3;

export default function LocationPicker({ open, onConfirm, onClose, initialLocation }) {
  const { t } = useTranslation();
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(initialLocation || null);
    setLoading(true);

    let map;
    let cancelled = false;

    (async () => {
      const { mapboxgl: mb, MapboxGeocoder: Geocoder } = await loadMapbox();
      if (cancelled) return;

      const center = initialLocation
        ? [initialLocation.lng, initialLocation.lat]
        : DEFAULT_CENTER;
      const zoom = initialLocation ? 14 : DEFAULT_ZOOM;

      map = new mb.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom,
      });

      mapRef.current = map;

      const marker = new mb.Marker({ draggable: true, color: '#4f46e5' });
      markerRef.current = marker;

      if (initialLocation) {
        marker.setLngLat([initialLocation.lng, initialLocation.lat]).addTo(map);
      }

      marker.on('dragend', async () => {
        const { lng, lat } = marker.getLngLat();
        const place = await reverseGeocode(lng, lat);
        setSelected({ lng, lat, ...place });
      });

      map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        marker.setLngLat([lng, lat]).addTo(map);
        const place = await reverseGeocode(lng, lat);
        setSelected({ lng, lat, ...place });
      });

      // Prevent map click from firing when interacting with controls
      const controlContainer = mapContainer.current.querySelector('.mapboxgl-control-container');
      if (controlContainer) {
        controlContainer.addEventListener('click', (e) => e.stopPropagation());
      }

      const geocoder = new Geocoder({
        accessToken: MAPBOX_TOKEN,
        mapboxgl: mb,
        marker: false,
        placeholder: t('common.searchPlace'),
        clearOnBlur: false,
        collapsed: false,
      });

      map.addControl(geocoder, 'top-left');

      geocoder.on('result', async (e) => {
        const [lng, lat] = e.result.center;
        marker.setLngLat([lng, lat]).addTo(map);
        setSelected({
          lng,
          lat,
          name: e.result.text || null,
          description: e.result.place_name || null,
        });
      });

      map.on('load', () => {
        if (!cancelled) setLoading(false);

        if (!initialLocation) {
          getCurrentPosition()
            .then((pos) => {
              if (cancelled) return;
              const { longitude: lng, latitude: lat } = pos.coords;
              map.flyTo({ center: [lng, lat], zoom: 12 });
            })
            .catch(() => {});
        }
      });
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open]);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const { longitude: lng, latitude: lat } = pos.coords;
      const map = mapRef.current;
      const marker = markerRef.current;
      if (map && marker) {
        map.flyTo({ center: [lng, lat], zoom: 14 });
        marker.setLngLat([lng, lat]).addTo(map);
        const place = await reverseGeocode(lng, lat);
        setSelected({ lng, lat, ...place });
      }
    } catch {}
    setLocating(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-stone-50 dark:bg-stone-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700 z-10">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          aria-label={t('common.close')}
        >
          <X size={18} />
        </button>
        <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
          {t('common.attachLocation')}
        </span>
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          <Check size={14} />
          {t('common.confirmLocation')}
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div ref={mapContainer} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-stone-800">
            <span className="text-stone-400 animate-pulse">Loading map...</span>
          </div>
        )}

        <button
          onClick={handleLocate}
          disabled={locating}
          className="absolute bottom-4 right-4 z-10 p-3 rounded-full bg-white dark:bg-stone-800 shadow-lg text-stone-600 dark:text-stone-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
          aria-label={t('common.useMyLocation')}
        >
          <LocateFixed size={20} className={locating ? 'animate-pulse' : ''} />
        </button>
      </div>

      {selected && (
        <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
          <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {selected.name || t('common.somePlace')}
          </p>
          {selected.description && selected.description !== selected.name && (
            <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
              {selected.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
