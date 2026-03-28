// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Default stability in seconds.
 * Tuned so an unreinforced chip reaches ~0.3 strength in about 7 minutes.
 * 0.3 = e^(-t/360)  →  t = 360 * ln(1/0.3) ≈ 433s ≈ 7.2 min
 */
export const DEFAULT_STABILITY = 15;

/** Below this strength, chips are deleted on the next send. */
export const FORGET_THRESHOLD = 0.3;

/** Stability multipliers per reinforcement (index = min(count, 2)). */
const STABILITY_MULTIPLIERS = [1.5, 1.8, 2.0];

// ── Core decay math ──────────────────────────────────────────────────────────

/**
 * Compute strength using exponential decay with real clock time.
 * strength = e^(-t / stability)
 * @param {number} lastInteractionTime - ms timestamp of last interaction
 * @param {number} stability - decay time constant in seconds
 * @returns {number} strength in [0, 1]
 */
export function getStrength(lastInteractionTime, stability = DEFAULT_STABILITY) {
  const elapsedMs = Math.max(0, Date.now() - lastInteractionTime);
  const t = elapsedMs / 1000; // convert to seconds
  return Math.max(0, Math.min(1, Math.exp(-t / stability)));
}

/**
 * Compute opacity from strength.
 * opacity = max(strength, 0.08)
 */
export function getOpacity(strength) {
  return Math.max(0.08, strength);
}

// ── Strengthening ────────────────────────────────────────────────────────────

/**
 * Reinforce a message: reset lastInteractionTime, increase stability.
 * Returns a new message object (pure function).
 */
export function reinforceMessage(msg) {
  const count = msg.reinforcementCount ?? 0;
  const multiplierIdx = Math.min(count, STABILITY_MULTIPLIERS.length - 1);
  const multiplier = STABILITY_MULTIPLIERS[multiplierIdx];

  return {
    ...msg,
    stability: (msg.stability ?? DEFAULT_STABILITY) * multiplier,
    reinforcementCount: count + 1,
    lastInteractionTime: Date.now(),
  };
}
