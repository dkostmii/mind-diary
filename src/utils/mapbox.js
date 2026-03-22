export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export async function reverseGeocode(lng, lat) {
  if (!MAPBOX_TOKEN) return { name: null, description: null };
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const data = await res.json();
    const feature = data.features?.[0];
    return {
      name: feature?.text || null,
      description: feature?.place_name || null,
    };
  } catch {
    return { name: null, description: null };
  }
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}
