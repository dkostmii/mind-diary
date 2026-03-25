function genId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const URL_REGEX = /https?:\/\/[^\s<]+/g;

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (['www.youtube.com', 'youtube.com', 'music.youtube.com'].includes(u.hostname)) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
    }
  } catch {}
  return null;
}

function getMusicLabel(url) {
  try {
    const h = new URL(url).hostname;
    if (h === 'open.spotify.com') return 'Spotify';
    if (h === 'music.apple.com') return 'Apple Music';
    if (['soundcloud.com', 'www.soundcloud.com', 'on.soundcloud.com', 'm.soundcloud.com'].includes(h))
      return 'SoundCloud';
    if (h === 'music.youtube.com') return 'YouTube Music';
  } catch {}
  return null;
}

function extractCommon(text, images, location, sourceKey, sourceId, createdAt) {
  const fragments = [];
  const rawText = text || '';
  const urls = rawText.match(URL_REGEX) || [];

  // Text fragments: one per sentence, excluding URL tokens
  const textWithoutUrls = rawText.replace(URL_REGEX, '').replace(/[^\S\n]{2,}/g, ' ').trim();
  for (const sentence of extractSentences(textWithoutUrls)) {
    fragments.push({
      id: genId(),
      type: 'text',
      content: { excerpt: sentence },
      [sourceKey]: sourceId,
      createdAt,
    });
  }

  // Photo fragments
  for (let i = 0; i < (images || []).length; i++) {
    fragments.push({
      id: genId(),
      type: 'photo',
      content: { photoId: `${sourceId}-img-${i}`, data: images[i] },
      [sourceKey]: sourceId,
      createdAt,
    });
  }

  // Location fragment
  if (location) {
    fragments.push({
      id: genId(),
      type: 'location',
      content: { name: location.name, lat: location.lat, lng: location.lng },
      [sourceKey]: sourceId,
      createdAt,
    });
  }

  // Music / video fragments from URLs in text
  for (const url of urls) {
    const ytId = getYouTubeId(url);
    const musicLabel = getMusicLabel(url);

    if (musicLabel) {
      fragments.push({
        id: genId(),
        type: 'music',
        content: { url, label: musicLabel },
        [sourceKey]: sourceId,
        createdAt,
      });
    } else if (ytId) {
      fragments.push({
        id: genId(),
        type: 'video',
        content: { url, label: 'YouTube' },
        [sourceKey]: sourceId,
        createdAt,
      });
    }
  }

  return fragments;
}

export function extractFragments(message) {
  return extractCommon(
    message.text, message.images, message.location,
    'sourceMessageId', message.id, message.createdAt
  );
}

export function extractFragmentsFromReflection(reflection) {
  return extractCommon(
    reflection.text, reflection.images, reflection.location,
    'sourceReflectionId', reflection.id, reflection.createdAt
  );
}

function extractSentences(text) {
  if (!text) return [];

  // First split by newlines into paragraphs
  const paragraphs = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);

  const sentences = [];
  for (const para of paragraphs) {
    // Split each paragraph into sentences by punctuation
    const parts = para
      .split(/(?<=[.!?…])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length > 1) {
      sentences.push(...parts);
    } else {
      // No sentence punctuation — keep paragraph as one chunk
      sentences.push(para);
    }
  }

  return sentences.filter((s) => s.length > 0);
}
