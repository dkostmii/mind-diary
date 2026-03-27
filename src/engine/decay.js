// Default lifetime in hours (used when fewer than 2 composer operations).
// Effectively infinite — nothing fades until the user has submitted twice.
const DEFAULT_LIFETIME = 9999;

// Upper bound for the adaptive lifetime.
const MAX_LIFETIME = 336; // 14 days — for very infrequent users

// How many median gaps of inactivity until a node fully fades (0%).
const FREQUENCY_MULTIPLIER = 6;

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
 * Derive the lifetime from composer operation frequency.
 * Lifetime = how many hours from 100% to 0% (linear).
 * Each composer submit is one datapoint. Needs ≥2 to produce a real value;
 * otherwise returns DEFAULT_LIFETIME (effectively no fading).
 */
export function computeBaseHalfLife() {
  const timestamps = loadComposerTimestamps().sort((a, b) => a - b);

  if (timestamps.length < 2) return DEFAULT_LIFETIME;

  const gaps = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push(timestamps[i] - timestamps[i - 1]);
  }

  gaps.sort((a, b) => a - b);
  const medianMs = gaps[Math.floor(gaps.length / 2)];
  const medianHours = medianMs / (1000 * 60 * 60);

  return Math.min(MAX_LIFETIME, medianHours * FREQUENCY_MULTIPLIER);
}

/** Return the most recent composer operation timestamp, or null. */
export function getLastComposerTimestamp() {
  const ts = loadComposerTimestamps();
  return ts.length > 0 ? Math.max(...ts) : null;
}

/**
 * Compute decay from createdAt only (linear).
 * Decay is measured up to the last composer operation, not Date.now().
 * retention goes from 1.0 → 0.0 linearly over `effectiveLifetime` hours.
 *
 * Molecules with more children decay faster:
 *   effectiveLifetime = lifetime / (1 + log2(childCount))
 * A 2-atom molecule = 1x, 4 atoms ≈ 0.7x, 8 atoms ≈ 0.5x, 16 atoms ≈ 0.33x.
 * Atoms (no children) always use the base lifetime.
 */
export function getDecay(node, lifetime = DEFAULT_LIFETIME) {
  const anchor = getLastComposerTimestamp() ?? node.createdAt;
  const elapsed = Math.max(0, anchor - node.createdAt);
  const hoursSinceCreation = elapsed / (1000 * 60 * 60);

  const childCount = node.childIds?.length || 0;
  const sizePenalty = childCount > 1 ? 1 + Math.log2(childCount) : 1;
  const effectiveLifetime = lifetime / sizePenalty;

  const retention = Math.max(0, 1 - hoursSinceCreation / effectiveLifetime);

  const opacity = Math.max(0.12, retention);
  const blur = Math.max(0, (1 - retention) * 8);

  return { opacity, blur, retention };
}

// Dissolution threshold — below this retention, molecules break apart.
export const DISSOLVE_THRESHOLD = 0.05;
