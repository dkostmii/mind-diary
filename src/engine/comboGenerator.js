function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export function generateFragmentCombo(fragments, recentCombos = []) {
  const recentIds = new Set(
    recentCombos.slice(-5).flatMap((c) => c.fragmentIds)
  );
  const available = fragments.filter((f) => !recentIds.has(f.id));
  if (available.length < 3) return null;

  const comboSize =
    available.length >= 50 ? randInt(3, 5) :
    available.length >= 20 ? randInt(3, 4) : 3;

  const byType = groupBy(available, 'type');
  const types = shuffle(Object.keys(byType));
  const selected = [];

  for (const type of types) {
    if (selected.length >= comboSize) break;
    selected.push(randomItem(byType[type]));
  }

  const remaining = available.filter((f) => !selected.includes(f));
  while (selected.length < comboSize && remaining.length > 0) {
    const pick = randomItem(remaining);
    selected.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }

  return shuffle(selected);
}
