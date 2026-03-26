// Default half-life in hours (used when there's not enough data to adapt).
const DEFAULT_HALF_LIFE = 48; // 2 days

// Clamp bounds for the adaptive half-life.
const MIN_HALF_LIFE = 0.5;  // 30 minutes — for very frequent loggers
const MAX_HALF_LIFE = 168;   // 7 days — for very infrequent users

// How many median gaps of inactivity until a node reaches ~50% visibility.
// 3× means: if you typically create atoms every X hours,
// an untouched atom fades to 50% after ~3X hours.
const FREQUENCY_MULTIPLIER = 3;

/**
 * Derive the base half-life from how often the user creates atoms.
 * Call once per render cycle (not per node) and pass the result to getDecay.
 */
export function computeBaseHalfLife(nodes) {
  const timestamps = nodes
    .filter(n => n.level === 'atom')
    .map(n => n.createdAt)
    .sort((a, b) => a - b);

  if (timestamps.length < 3) return DEFAULT_HALF_LIFE;

  // Compute gaps between consecutive atom creations
  const gaps = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push(timestamps[i] - timestamps[i - 1]);
  }

  // Median gap (robust to outliers like overnight pauses)
  gaps.sort((a, b) => a - b);
  const medianMs = gaps[Math.floor(gaps.length / 2)];
  const medianHours = medianMs / (1000 * 60 * 60);

  return Math.max(MIN_HALF_LIFE, Math.min(MAX_HALF_LIFE, medianHours * FREQUENCY_MULTIPLIER));
}

export function getDecay(node, baseHalfLife = DEFAULT_HALF_LIFE) {
  const hoursSinceInteraction =
    (Date.now() - node.lastInteractedAt) / (1000 * 60 * 60);

  // Stability increases with interactions (logarithmic, diminishing returns)
  // 1 interaction = 1x, 3 = ~2x, 7 = ~2.9x, 15 = ~3.7x
  const stability = 1 + Math.log2(Math.max(1, node.interactionCount));

  // Effective half-life scales with stability
  const effectiveHalfLife = baseHalfLife * stability;

  // Exponential decay: retention = 2^(-t/halfLife)
  const retention = Math.pow(2, -hoursSinceInteraction / effectiveHalfLife);

  // Map retention (0-1) to visual properties
  const opacity = Math.max(0.12, retention);
  const blur = Math.max(0, (1 - retention) * 8);

  return { opacity, blur, retention };
}

// Dissolution threshold — below this retention, molecules break apart.
export const DISSOLVE_THRESHOLD = 0.05;

// Call this whenever a user interacts with a node
export function refreshNode(node) {
  return {
    ...node,
    lastInteractedAt: Date.now(),
    interactionCount: (node.interactionCount || 1) + 1,
  };
}
