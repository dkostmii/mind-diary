// Base half-life in hours: how long until a node reaches ~50% visibility
// with no interactions beyond creation.
const BASE_HALF_LIFE = 48; // 2 days

export function getDecay(node) {
  const hoursSinceInteraction =
    (Date.now() - node.lastInteractedAt) / (1000 * 60 * 60);

  // Stability increases with interactions (logarithmic, diminishing returns)
  // 1 interaction = 1x, 3 = ~2x, 7 = ~2.9x, 15 = ~3.7x
  const stability = 1 + Math.log2(Math.max(1, node.interactionCount));

  // Effective half-life scales with stability
  const effectiveHalfLife = BASE_HALF_LIFE * stability;

  // Exponential decay: retention = 2^(-t/halfLife)
  const retention = Math.pow(2, -hoursSinceInteraction / effectiveHalfLife);

  // Map retention (0-1) to visual properties
  const opacity = Math.max(0.12, retention);
  const blur = Math.max(0, (1 - retention) * 8);

  return { opacity, blur, retention };
}

// Call this whenever a user interacts with a node
export function refreshNode(node) {
  return {
    ...node,
    lastInteractedAt: Date.now(),
    interactionCount: (node.interactionCount || 1) + 1,
  };
}
