export const UNLOCK_THRESHOLDS = [
  { key: 'basic',      test: (s) => s.total >= 10,          label: 'reflect.unlockBasic' },
  { key: 'visual',     test: (s) => s.byType.photo > 0,     label: 'reflect.unlockVisual' },
  { key: 'sensory',    test: (s) => s.byType.music > 0,     label: 'reflect.unlockSensory' },
  { key: 'placeBased', test: (s) => s.byType.location > 0,  label: 'reflect.unlockPlace' },
  { key: 'rich',       test: (s) => s.total >= 50,          label: 'reflect.unlockRich' },
  { key: 'full',       test: (s) => s.total >= 100,         label: 'reflect.unlockFull' },
];

export function getPoolStats(fragments) {
  const byType = {
    text:     fragments.filter((f) => f.type === 'text').length,
    photo:    fragments.filter((f) => f.type === 'photo').length,
    music:    fragments.filter((f) => f.type === 'music').length,
    video:    fragments.filter((f) => f.type === 'video').length,
    location: fragments.filter((f) => f.type === 'location').length,
  };
  const total = fragments.length;
  const combos = total >= 3 ? Math.round(total * (total - 1) * (total - 2) / 6) : 0;
  return { byType, total, combos };
}

export function getUnlockedFeatures(stats) {
  return UNLOCK_THRESHOLDS.filter((t) => t.test(stats)).map((t) => t.key);
}
