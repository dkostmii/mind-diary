export function getDecayLevel(createdAt, pinned = false) {
  if (pinned) return { blur: 0, opacity: 1.0 };

  const hoursAgo = (Date.now() - createdAt) / (1000 * 60 * 60);

  if (hoursAgo < 24)  return { blur: 0,    opacity: 1.0  };
  if (hoursAgo < 72)  return { blur: 6,    opacity: 0.75 };
  if (hoursAgo < 168) return { blur: 12,   opacity: 0.55 };
  if (hoursAgo < 720) return { blur: 20,   opacity: 0.4  };
  return                     { blur: 28,   opacity: 0.3  };
}
