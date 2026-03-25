import { format, subDays, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

export function calcStreak(messages) {
  if (messages.length === 0) return 0;

  const datesWithEntries = new Set(messages.map((m) => m.date));
  let streak = 0;
  let day = new Date();

  // If no entries today, allow streak to continue from yesterday
  // (streak only breaks after a full day with no entries)
  if (!datesWithEntries.has(format(day, 'yyyy-MM-dd'))) {
    day = subDays(day, 1);
    if (!datesWithEntries.has(format(day, 'yyyy-MM-dd'))) {
      return 0;
    }
  }

  while (datesWithEntries.has(format(day, 'yyyy-MM-dd'))) {
    streak++;
    day = subDays(day, 1);
  }

  return streak;
}

export function computeWeeklySummary(messages, weekStartDay = 'monday') {
  const now = new Date();
  const weekStart = startOfWeek(now, {
    weekStartsOn: weekStartDay === 'monday' ? 1 : 0,
  });
  const weekEnd = endOfWeek(now, {
    weekStartsOn: weekStartDay === 'monday' ? 1 : 0,
  });

  const weekMessages = messages.filter((m) => {
    const d = new Date(m.date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  });

  const allReflected = messages.filter((m) => m.reflection !== null);

  return {
    entriesThisWeek: weekMessages.length,
    streak: calcStreak(messages),
    totalReflections: allReflected.length,
  };
}
