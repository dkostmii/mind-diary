const URL_REGEX = /https?:\/\/[^\s<]+/g;

function genId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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

function extractExcerpts(text) {
  if (!text) return [];

  // Remove URLs from text before splitting into sentences
  const textWithoutUrls = text.replace(URL_REGEX, '').replace(/[^\S\n]{2,}/g, ' ').trim();
  if (!textWithoutUrls) return [];

  // Split by newlines into paragraphs, then by sentence boundaries
  const paragraphs = textWithoutUrls.split(/\n+/).map(p => p.trim()).filter(Boolean);

  const sentences = [];
  for (const para of paragraphs) {
    const parts = para
      .split(/(?<=[.!?…])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (parts.length > 1) {
      sentences.push(...parts);
    } else {
      sentences.push(para);
    }
  }

  if (sentences.length === 0) return [textWithoutUrls];

  // Each sentence becomes its own atom.
  // Very long sentences (>12 words) get split on clause boundaries.
  const results = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (words <= 12) {
      results.push(sentence);
    } else {
      const clauses = sentence.split(/[,;:\u2014\-\u2013]/)
        .map(c => c.trim())
        .filter(c => c.split(/\s+/).length >= 2);
      if (clauses.length > 1) {
        results.push(...clauses);
      } else {
        results.push(sentence);
      }
    }
  }
  return results.filter(s => s.length > 0);
}

function buildContent(att) {
  switch (att.type) {
    case 'photo':    return { data: att.data };
    case 'music':    return { title: att.title || '', artist: att.artist || '', url: att.url };
    case 'video':    return { thumbnailUrl: att.thumbnailUrl || '', url: att.url };
    case 'location': return { name: att.name || '', lat: att.lat, lng: att.lng };
    case 'link':     return { url: att.url, title: att.title || '' };
    default:         return {};
  }
}

export function decomposeEntry(text, attachments = []) {
  const atoms = [];
  const now = Date.now();
  const base = {
    level: 'atom',
    childIds: [],
    note: null,
    createdAt: now,
  };

  // 1. Text -> split into sentence/clause atoms
  if (text && text.trim()) {
    const excerpts = extractExcerpts(text);
    for (const excerpt of excerpts) {
      atoms.push({
        ...base,
        id: genId(),
        type: 'text',
        content: { excerpt },
      });
    }

    // 2. Extract music/video atoms from URLs in text
    const urls = text.match(URL_REGEX) || [];
    for (const url of urls) {
      const musicLabel = getMusicLabel(url);
      const ytId = getYouTubeId(url);

      if (musicLabel) {
        atoms.push({
          ...base,
          id: genId(),
          type: 'music',
          content: { url, label: musicLabel },
        });
      } else if (ytId) {
        atoms.push({
          ...base,
          id: genId(),
          type: 'video',
          content: { url, label: 'YouTube' },
        });
      } else {
        atoms.push({
          ...base,
          id: genId(),
          type: 'link',
          content: { url, title: '' },
        });
      }
    }
  }

  // 3. Each explicit attachment -> one atom
  for (const att of attachments) {
    atoms.push({
      ...base,
      id: genId(),
      type: att.type,
      content: buildContent(att),
    });
  }

  return atoms;
}
