// Default half-life in hours (used when fewer than 2 composer operations).
// Effectively infinite — nothing fades until the user has submitted twice.
const DEFAULT_HALF_LIFE = 9999;

// Upper bound for the adaptive half-life.
const MAX_HALF_LIFE = 168; // 7 days — for very infrequent users

// How many median gaps of inactivity until a node reaches ~50% visibility.
const FREQUENCY_MULTIPLIER = 3;

// localStorage key for composer operation timestamps.
const COMPOSER_TS_KEY = 'mind-diary-composer-ts';

/** Record a composer operation (one submit = one datapoint). */
export function recordComposerOperation() {
  const ts = loadComposerTimestamps();
  ts.push(Date.now());
  localStorage.setItem(COMPOSER_TS_KEY, JSON.stringify(ts));
}

/** Load stored composer timestamps. */
export function loadComposerTimestamps() {
  try {
    return JSON.parse(localStorage.getItem(COMPOSER_TS_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Derive the base half-life from composer operation frequency.
 * Each composer submit is one datapoint. Needs ≥2 to produce a real value;
 * otherwise returns DEFAULT_HALF_LIFE (effectively no fading).
 */
export function computeBaseHalfLife() {
  const timestamps = loadComposerTimestamps().sort((a, b) => a - b);

  if (timestamps.length < 2) return DEFAULT_HALF_LIFE;

  const gaps = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push(timestamps[i] - timestamps[i - 1]);
  }

  gaps.sort((a, b) => a - b);
  const medianMs = gaps[Math.floor(gaps.length / 2)];
  const medianHours = medianMs / (1000 * 60 * 60);

  return Math.min(MAX_HALF_LIFE, medianHours * FREQUENCY_MULTIPLIER);
}

/** Return the most recent composer operation timestamp, or null. */
export function getLastComposerTimestamp() {
  const ts = loadComposerTimestamps();
  return ts.length > 0 ? Math.max(...ts) : null;
}

/**
 * Compute decay from createdAt only.
 * Decay is measured up to the last composer operation, not Date.now().
 * This means decay advances in discrete steps (each composer use), not continuously.
 */
export function getDecay(node, baseHalfLife = DEFAULT_HALF_LIFE) {
  const anchor = getLastComposerTimestamp() ?? node.createdAt;
  const elapsed = Math.max(0, anchor - node.createdAt);
  const hoursSinceCreation = elapsed / (1000 * 60 * 60);

  const retention = Math.pow(2, -hoursSinceCreation / baseHalfLife);

  const opacity = Math.max(0.12, retention);
  const blur = Math.max(0, (1 - retention) * 8);

  return { opacity, blur, retention };
}

// Dissolution threshold — below this retention, molecules break apart.
export const DISSOLVE_THRESHOLD = 0.05;
