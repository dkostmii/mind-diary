// ── Constants ────────────────────────────────────────────────────────────────

/** Default stability for a brand-new atom (in ticks). */
export const DEFAULT_STABILITY = 12;

/**
 * Passive tick interval: how many ms of real inactivity equals one passive tick.
 * 4 hours → ~42 passive ticks per week of inactivity.
 * At stability=12, that gives strength ≈ e^(-42/12) ≈ 0.03 — nearly dissolved.
 */
export const PASSIVE_TICK_INTERVAL_MS = 4 * 60 * 60 * 1000;

/** Below this strength, molecules dissolve and orphan atoms are deleted. */
export const DISSOLVE_THRESHOLD = 0.05;

/** Stability multipliers per reinforcement (index = min(count, 2)). */
const STABILITY_MULTIPLIERS = [1.5, 1.8, 2.0];

/** Strength restore fractions per reinforcement (index = min(count, 3)). */
const RESTORE_AMOUNTS = [0.15, 0.18, 0.21, 0.25];

const LAST_ACTIVE_KEY = 'mind-diary-last-active-ts';

// ── Core decay math ──────────────────────────────────────────────────────────

/**
 * Compute strength of a single atom using exponential decay.
 * strength = e^(-t / stability)  where t = ticksSinceReinforcement.
 */
export function getStrength(atom) {
  const t = atom.ticksSinceReinforcement ?? 0;
  const s = atom.stability ?? DEFAULT_STABILITY;
  return Math.max(0, Math.min(1, Math.exp(-t / s)));
}

/**
 * Compute decay visuals for any node.
 * - Atoms: uses getStrength directly.
 * - Molecules: weighted average of child atom strengths (equal weight).
 *   No size penalty.
 *
 * @param {object} node
 * @param {object[]} allNodes - full nodes array (needed to look up children)
 */
export function getDecay(node, allNodes = []) {
  let retention;

  if (node.level === 'molecule') {
    const children = (node.childIds || [])
      .map(id => allNodes.find(n => n.id === id))
      .filter(Boolean);
    if (children.length === 0) {
      retention = 0;
    } else {
      const sum = children.reduce((acc, c) => acc + getStrength(c), 0);
      retention = sum / children.length;
    }
  } else {
    retention = getStrength(node);
  }

  const opacity = Math.max(0.12, retention);
  const blur = Math.max(0, (1 - retention) * 8);

  return { opacity, blur, retention };
}

// ── Tick helpers ──────────────────────────────────────────────────────────────

/**
 * Return a new atom with ticks incremented.
 * Pure function — does not mutate.
 */
export function applyTicksToAtom(atom, ticks) {
  if (atom.level !== 'atom' || ticks <= 0) return atom;
  return {
    ...atom,
    ticksSinceReinforcement: (atom.ticksSinceReinforcement ?? 0) + ticks,
  };
}

/**
 * Compute how many passive ticks have elapsed since last active timestamp.
 */
export function computePassiveTicks(lastActiveTs) {
  if (!lastActiveTs) return 0;
  const elapsed = Math.max(0, Date.now() - lastActiveTs);
  return Math.floor(elapsed / PASSIVE_TICK_INTERVAL_MS);
}

// ── Strengthening ────────────────────────────────────────────────────────────

/**
 * Reinforce an atom: increase stability, reset tick counter.
 * Returns a new atom object (pure function).
 */
export function reinforceAtom(atom) {
  const count = atom.reinforcementCount ?? 0;
  const multiplierIdx = Math.min(count, STABILITY_MULTIPLIERS.length - 1);
  const multiplier = STABILITY_MULTIPLIERS[multiplierIdx];

  return {
    ...atom,
    stability: (atom.stability ?? DEFAULT_STABILITY) * multiplier,
    reinforcementCount: count + 1,
    ticksSinceReinforcement: 0,
    lastReinforcedAt: Date.now(),
  };
}

/**
 * Get the strength restore amount for the current reinforcement count.
 * The caller adds this to the displayed bar, capped at 1.0.
 */
export function getRestoreAmount(reinforcementCount) {
  const idx = Math.min(reinforcementCount ?? 0, RESTORE_AMOUNTS.length - 1);
  return RESTORE_AMOUNTS[idx];
}

// ── Last-active timestamp (localStorage) ─────────────────────────────────────

export function getLastActiveTimestamp() {
  try {
    const v = localStorage.getItem(LAST_ACTIVE_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export function setLastActiveTimestamp(ts = Date.now()) {
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(ts));
  } catch {}
}
