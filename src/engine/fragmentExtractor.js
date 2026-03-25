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

export function extractFragments(message) {
  const fragments = [];
  const text = message.text || '';
  const urls = text.match(URL_REGEX) || [];

  // Text fragments: one per sentence, excluding URL tokens
  const textWithoutUrls = text.replace(URL_REGEX, '').replace(/\s{2,}/g, ' ').trim();
  for (const sentence of extractSentences(textWithoutUrls)) {
    fragments.push({
      id: genId(),
      type: 'text',
      content: { excerpt: sentence },
      sourceMessageId: message.id,
      createdAt: message.createdAt,
    });
  }

  // Photo fragments
  for (let i = 0; i < (message.images || []).length; i++) {
    fragments.push({
      id: genId(),
      type: 'photo',
      content: { photoId: `${message.id}-img-${i}`, data: message.images[i] },
      sourceMessageId: message.id,
      createdAt: message.createdAt,
    });
  }

  // Location fragment
  if (message.location) {
    fragments.push({
      id: genId(),
      type: 'location',
      content: {
        name: message.location.name,
        lat: message.location.lat,
        lng: message.location.lng,
      },
      sourceMessageId: message.id,
      createdAt: message.createdAt,
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
        sourceMessageId: message.id,
        createdAt: message.createdAt,
      });
    } else if (ytId) {
      fragments.push({
        id: genId(),
        type: 'video',
        content: { url, label: 'YouTube' },
        sourceMessageId: message.id,
        createdAt: message.createdAt,
      });
    }
  }

  return fragments;
}

function extractSentences(text) {
  if (!text) return [];
  // Split on sentence-ending punctuation followed by whitespace or end of string
  const sentences = text
    .split(/(?<=[.!?])\s+|(?<=[.!?])$/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).filter(Boolean).length >= 1);

  if (sentences.length === 0) {
    const trimmed = text.trim();
    if (trimmed.length > 0) return [trimmed.split(/\s+/).slice(0, 12).join(' ')];
    return [];
  }
  return sentences;
}
