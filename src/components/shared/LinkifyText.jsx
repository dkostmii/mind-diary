import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import ImageGallery from './ImageGallery';

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

function isMediaUrl(url) {
  return !!(getYouTubeId(url) || getSpotifyEmbed(url) || getAppleMusicEmbed(url) || isSoundCloudUrl(url));
}

const IMAGE_EXT_REGEX = /\.(jpe?g|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;

function isImageUrl(url) {
  try {
    const u = new URL(url);
    return IMAGE_EXT_REGEX.test(u.pathname);
  } catch {}
  return false;
}

function getMediaLabel(url) {
  if (getYouTubeId(url)) return 'YouTube';
  if (getSpotifyEmbed(url)) return 'Spotify';
  if (getAppleMusicEmbed(url)) return 'Apple Music';
  if (isSoundCloudUrl(url)) return 'SoundCloud';
  return null;
}

function getMediaColors(url) {
  if (getYouTubeId(url)) return 'bg-red-600 hover:bg-red-700 text-white';
  if (getSpotifyEmbed(url)) return 'bg-[#1DB954] hover:bg-[#1aa34a] text-white';
  if (getAppleMusicEmbed(url)) return 'bg-gradient-to-r from-[#FC3C44] to-[#C53FAF] hover:from-[#e0353c] hover:to-[#b0389d] text-white';
  if (isSoundCloudUrl(url)) return 'bg-[#FF5500] hover:bg-[#e64d00] text-white';
  return '';
}

function MediaIcon({ url }) {
  const s = 14;
  if (getYouTubeId(url)) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
      </svg>
    );
  }
  if (getSpotifyEmbed(url)) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.4-2.1-10.5-1.1a.75.75 0 1 1-.3-1.5c4.6-1 8.5-.6 11.6 1.3a.75.75 0 0 1 .2 1.05zm1.5-3.3a.94.94 0 0 1-1.3.3c-3.2-2-8.1-2.5-11.9-1.4a.94.94 0 1 1-.5-1.8c4.3-1.3 9.7-.7 13.4 1.6a.94.94 0 0 1 .3 1.3zm.1-3.4c-3.9-2.3-10.2-2.5-13.9-1.4a1.12 1.12 0 1 1-.7-2.2c4.2-1.3 11.2-1 15.6 1.6a1.12 1.12 0 0 1-1 2z" />
      </svg>
    );
  }
  if (getAppleMusicEmbed(url)) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.9 6.7V17c0 1-.3 2-1 2.8-.6.8-1.4 1.3-2.4 1.5-1 .3-1.8.2-2.6-.2s-1.3-1-1.6-1.9c-.3-.8-.3-1.7 0-2.5.3-.8.9-1.4 1.6-1.8.8-.4 1.7-.6 2.7-.5.5.1 1 .2 1.4.4V8.8l-9.8 3v9.9c0 1-.3 2-1 2.8-.6.8-1.4 1.3-2.4 1.5-1 .3-1.8.2-2.6-.2-.8-.4-1.3-1-1.6-1.9-.3-.8-.3-1.7 0-2.5.3-.8.9-1.4 1.7-1.8.7-.4 1.6-.6 2.6-.5.5.1 1 .2 1.4.4V7.5c0-.5.1-1 .4-1.3.3-.4.6-.6 1-.7l10.3-3.2c.3-.1.5-.1.7 0 .2 0 .3.1.5.3.1.1.2.3.2.5v3.6z" />
      </svg>
    );
  }
  if (isSoundCloudUrl(url)) {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.2 14.3c-.1 0-.2-.1-.2-.2l-.4-2.3.4-2.4c0-.1.1-.2.2-.2s.2.1.2.2l.5 2.4-.5 2.3c0 .1-.1.2-.2.2zm1.9 1.3c-.1 0-.2-.1-.2-.2L2.4 12l.5-4c0-.1.1-.2.2-.2.2 0 .3.1.3.2l.4 4-.4 3.4c0 .1-.1.2-.3.2zm1.9.3c-.1 0-.3-.1-.3-.3L4.3 12l.4-5c0-.2.2-.3.3-.3.2 0 .3.1.3.3l.4 5-.4 3.6c0 .2-.1.3-.3.3zm2 .1c-.2 0-.3-.2-.3-.3l-.4-3.7.4-5.5c0-.2.1-.3.3-.3s.3.1.3.3l.3 5.5-.3 3.7c0 .1-.2.3-.3.3zm1.9 0c-.2 0-.3-.1-.4-.3l-.3-3.8.3-6c0-.2.2-.4.4-.4.2 0 .3.2.4.4l.3 6-.3 3.8c-.1.2-.2.3-.4.3zm2 0c-.2 0-.4-.2-.4-.4l-.3-3.7.3-6.2c0-.2.2-.4.4-.4.3 0 .4.2.4.4l.3 6.2-.3 3.7c0 .2-.1.4-.4.4zm2 0c-.2 0-.4-.2-.4-.4l-.2-3.6.2-6.6c0-.3.2-.5.5-.5.2 0 .4.2.5.5l.2 6.6-.2 3.6c-.1.2-.3.4-.5.4zm2 0c-.3 0-.5-.2-.5-.5L14 12l.4-6.6c0-.3.2-.5.5-.5s.5.2.5.5l.2 6.6-.2 3.5c0 .3-.2.5-.5.5zm2.4-.1c-.3 0-.5-.2-.5-.4l-.2-3.5.2-7c0-.3.2-.5.5-.5.4 0 .6.2.6.5l.1 7-.2 3.5c0 .2-.2.4-.5.4zm3.8-.4a3 3 0 0 0 2.9-3 3 3 0 0 0-2.6-3c-.5-2.8-2.9-4.9-5.8-4.9-1 0-1.9.2-2.7.7-.3.2-.4.4-.4.7v9.3c0 .3.2.5.5.5h8.1z" />
      </svg>
    );
  }
  return null;
}

function SoundCloudEmbed({ url }) {
  const [resolvedUrl, setResolvedUrl] = useState(
    isShortSoundCloudUrl(url) ? null : url
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    if (resolvedUrl || error) return;
    fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Failed to resolve');
        return res.json();
      })
      .then((data) => {
        const match = data.html?.match(/src="[^"]*url=([^&"]+)/);
        if (match) {
          setResolvedUrl(decodeURIComponent(match[1]));
        } else {
          setResolvedUrl(url);
        }
      })
      .catch(() => setError(true));
  }, [url, resolvedUrl, error]);

  if (error || !resolvedUrl) {
    return (
      <div className="w-full h-32 rounded-lg bg-stone-100 dark:bg-stone-800 animate-pulse flex items-center justify-center">
        <span className="text-stone-400 text-sm">
          {error ? 'Failed to load' : 'Loading SoundCloud...'}
        </span>
      </div>
    );
  }

  return (
    <iframe
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(resolvedUrl)}&color=%234f46e5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
      className="w-full h-32 rounded-lg"
      allow="autoplay"
      loading="lazy"
      title="SoundCloud"
    />
  );
}

function MediaEmbedContent({ url }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`}
        className="w-full aspect-video rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
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
        className={`w-full rounded-lg ${isTrackOrEpisode ? 'h-20' : 'h-80'}`}
        allow="encrypted-media"
        allowFullScreen
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
        className={`w-full rounded-lg ${isSong ? 'h-[175px]' : 'h-[450px]'}`}
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        title="Apple Music"
      />
    );
  }

  if (isSoundCloudUrl(url)) {
    return <SoundCloudEmbed url={url} />;
  }

  return null;
}

function MediaModal({ url, onClose }) {
  const { t } = useTranslation();
  const backdropRef = useRef(null);
  const pointerDownTarget = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onPointerDown={(e) => { pointerDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === backdropRef.current && pointerDownTarget.current === backdropRef.current) onClose();
        pointerDownTarget.current = null;
      }}
    >
      <div
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl mx-4 w-full max-w-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
            {getMediaLabel(url)}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>
        <MediaEmbedContent url={url} />
      </div>
    </div>
  );
}

function ImageLink({ url }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-block rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors my-1"
      >
        <img src={url} alt="" className="max-w-full max-h-64 object-contain" loading="lazy" />
      </button>
      {open && (
        <ImageGallery
          images={[url]}
          initialIndex={0}
          open
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function MediaLink({ url }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${getMediaColors(url)}`}
      >
        <MediaIcon url={url} />
        {getMediaLabel(url)}
      </button>
      {open && <MediaModal url={url} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function LinkifyText({ children }) {
  if (typeof children !== 'string') return children;

  const parts = children.split(URL_REGEX);

  return parts.map((part, i) => {
    if (!URL_REGEX.test(part)) return part;

    if (isMediaUrl(part)) {
      return <MediaLink key={i} url={part} />;
    }

    if (isImageUrl(part)) {
      return <ImageLink key={i} url={part} />;
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
