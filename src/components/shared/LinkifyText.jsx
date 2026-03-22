import { useState, useEffect } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (
      u.hostname === 'www.youtube.com' ||
      u.hostname === 'youtube.com' ||
      u.hostname === 'music.youtube.com'
    ) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
    }
  } catch {}
  return null;
}

function getSpotifyEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'open.spotify.com') {
      const match = u.pathname.match(/^\/(track|album|playlist|episode)\/(.+)/);
      if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
  } catch {}
  return null;
}

function getAppleMusicEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'music.apple.com') {
      // /ua/album/name/123 or /ua/playlist/name/pl.123 or /ua/song/name/123
      const match = u.pathname.match(/^\/([a-z]{2})\/(album|playlist|song|music-video)\/.+/);
      if (match) return `https://embed.music.apple.com${u.pathname}`;
    }
  } catch {}
  return null;
}

function isSoundCloudUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname === 'soundcloud.com' ||
      u.hostname === 'www.soundcloud.com' ||
      u.hostname === 'on.soundcloud.com' ||
      u.hostname === 'm.soundcloud.com'
    );
  } catch {}
  return false;
}

function isShortSoundCloudUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === 'on.soundcloud.com' || u.hostname === 'm.soundcloud.com';
  } catch {}
  return false;
}

function SoundCloudEmbed({ url }) {
  const [resolvedUrl, setResolvedUrl] = useState(
    isShortSoundCloudUrl(url) ? null : url
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (resolvedUrl || error) return;

    // Use SoundCloud's oEmbed to resolve short links to canonical URLs
    fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to resolve');
        return res.json();
      })
      .then((data) => {
        // Extract the canonical URL from the oembed html response
        const match = data.html?.match(/src="[^"]*url=([^&"]+)/);
        if (match) {
          setResolvedUrl(decodeURIComponent(match[1]));
        } else {
          // Fallback: use the original URL, the widget might handle it
          setResolvedUrl(url);
        }
      })
      .catch(() => setError(true));
  }, [url, resolvedUrl, error]);

  if (error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 dark:text-indigo-400 underline break-all"
      >
        {url}
      </a>
    );
  }

  if (!resolvedUrl) {
    return (
      <div className="w-full h-32 rounded-lg my-1 bg-stone-100 dark:bg-stone-800 animate-pulse flex items-center justify-center">
        <span className="text-stone-400 text-sm">Loading SoundCloud...</span>
      </div>
    );
  }

  return (
    <iframe
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(resolvedUrl)}&color=%234f46e5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
      className="w-full h-32 rounded-lg my-1"
      allow="autoplay"
      loading="lazy"
      title="SoundCloud"
    />
  );
}

function MediaEmbed({ url }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
        className="w-full aspect-video rounded-lg my-1"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        title="YouTube"
      />
    );
  }

  const spotifyEmbed = getSpotifyEmbed(url);
  if (spotifyEmbed) {
    const isTrackOrEpisode = /\/(track|episode)\//.test(url);
    return (
      <iframe
        src={spotifyEmbed}
        className={`w-full rounded-lg my-1 ${isTrackOrEpisode ? 'h-20' : 'h-80'}`}
        allow="encrypted-media"
        allowFullScreen
        loading="lazy"
        title="Spotify"
      />
    );
  }

  const appleMusicEmbed = getAppleMusicEmbed(url);
  if (appleMusicEmbed) {
    const isSong = /\/song\//.test(url);
    return (
      <iframe
        src={appleMusicEmbed}
        className={`w-full rounded-lg my-1 ${isSong ? 'h-[175px]' : 'h-[450px]'}`}
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        loading="lazy"
        title="Apple Music"
      />
    );
  }

  if (isSoundCloudUrl(url)) {
    return <SoundCloudEmbed url={url} />;
  }

  return null;
}

export default function LinkifyText({ children }) {
  if (typeof children !== 'string') return children;

  const parts = children.split(URL_REGEX);

  return parts.map((part, i) => {
    if (!URL_REGEX.test(part)) return part;

    const hasEmbed = getYouTubeId(part) || getSpotifyEmbed(part) || getAppleMusicEmbed(part) || isSoundCloudUrl(part);

    if (hasEmbed) {
      return <MediaEmbed key={`embed-${i}`} url={part} />;
    }

    return (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 dark:text-indigo-400 underline break-all"
      >
        {part}
      </a>
    );
  });
}
