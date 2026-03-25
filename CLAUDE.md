# Mind Diary — CLAUDE.md

## Project overview

Mind Diary is a **memory simulator** — a privacy-first journaling app that mirrors how human memory actually works. Users capture moments with text, photos, music, video, and locations. Over time, entries visually blur like real memories fading. But the fragments that mattered — a phrase, a photo, a song, a place — survive permanently in a fragment pool. The Reflect screen shuffles random fragments from different entries, and the user writes whatever the combination triggers. The thinking is theirs.

There is no chatbot, no AI, no scripted replies, no recommendation algorithm.

Primary language: Ukrainian. Secondary: English.

## Tech stack

- **Framework**: React 18+ with Vite (SPA, client-only, no SSR)
- **Routing**: React Router v6 (hash router for static deployment compatibility)
- **State management**: Zustand (lightweight, no boilerplate)
- **Storage**: Browser localStorage + IndexedDB via `idb` library (all data stays on-device)
- **Styling**: Tailwind CSS 3 (utility-first, dark mode built-in)
- **Date handling**: date-fns (tree-shakeable, no moment.js)
- **i18n**: Custom hook + JSON translation files (two languages, no heavy library)
- **Testing**: Vitest + React Testing Library
- **Build**: Vite, output to `dist/`

## Architecture

```
src/
├── app/
│   ├── App.jsx                # Root component, router setup, language provider
│   └── routes.jsx             # Route definitions
├── components/
│   ├── journal/
│   │   ├── MessageFeed.jsx    # Scrollable list of messages with timestamps + blur
│   │   ├── MessageCard.jsx    # Single message with inline media + decay overlay
│   │   ├── ComposeBar.jsx     # Bottom-fixed text input + attachment buttons + send
│   │   └── EmptyState.jsx     # Shown when no messages exist yet
│   ├── reflect/
│   │   ├── FragmentCollage.jsx # Random combo of 3-5 fragment cards
│   │   ├── FragmentCard.jsx   # Renders a single fragment by type (text/photo/music/video/location)
│   │   ├── ReflectCompose.jsx # Compose area below the collage
│   │   └── ShuffleButton.jsx  # Request a new random combination
│   ├── recall/
│   │   ├── RecallFeed.jsx     # Full message history with blur applied
│   │   └── FilterBar.jsx      # All / Has reflection / No reflection
│   ├── pool/
│   │   ├── PoolBar.jsx        # Compact bar chart of fragment types (for app bar)
│   │   ├── PoolStats.jsx      # Full pool view: counts, combo count, unlock status
│   │   └── UnlockToast.jsx    # Notification when a new combo type unlocks
│   ├── summary/
│   │   └── WeeklySummary.jsx  # Stats: entries, streak, fragments, reflections, combos
│   └── shared/
│       ├── LanguageSelector.jsx
│       └── OnboardingFlow.jsx # Language → name → blur philosophy → journal
├── i18n/
│   ├── uk.js                  # Ukrainian translations (primary)
│   ├── en.js                  # English translations
│   └── index.js               # LanguageContext provider + useTranslation hook
├── store/
│   ├── useMessageStore.js     # Zustand: messages (IndexedDB)
│   ├── useFragmentStore.js    # Zustand: fragments (IndexedDB) — NEW
│   ├── useReflectionStore.js  # Zustand: reflections (IndexedDB) — NEW
│   └── useUserStore.js        # User profile (localStorage)
├── engine/
│   ├── fragmentExtractor.js   # Extract fragments from a message on save — NEW
│   ├── comboGenerator.js      # Generate random fragment combos for Reflect — NEW
│   ├── decayCalculator.js     # Compute blur/opacity from entry age — NEW
│   └── poolStats.js           # Pool counts, combo math, unlock thresholds — NEW
├── pages/
│   ├── Journal.jsx            # Main screen — message feed + compose + pool bar
│   ├── Reflect.jsx            # Fragment collage + association compose — REDESIGNED
│   ├── Recall.jsx             # Browse all messages with blur + filters
│   ├── Settings.jsx           # Name, language, export/import
│   └── Onboarding.jsx         # First-launch flow with blur philosophy
├── utils/
│   ├── storage.js             # IndexedDB wrapper (idb)
│   ├── exportData.js          # JSON/CSV export (always exports full unblurred data)
│   └── streak.js              # Streak and weekly stats calculations
└── index.jsx                  # Entry point
```

## Core data models

### Message (IndexedDB `messages` store) — updated

```js
{
  id: crypto.randomUUID(),
  text: 'Whatever the user wrote',
  createdAt: 1710700000000,
  date: '2026-03-17',
  pinned: false,                    // Premium: bypass decay
  attachments: [                    // Already built
    { type: 'photo', id: 'att-1', data: '...' },
    { type: 'music', id: 'att-2', url: '...', title: '...', artist: '...' },
    { type: 'video', id: 'att-3', url: '...', thumbnailUrl: '...' },
    { type: 'location', id: 'att-4', name: '...', lat: 49.84, lng: 24.02 }
  ]
}
```

### Fragment (IndexedDB `fragments` store) — new

```js
{
  id: crypto.randomUUID(),
  type: 'text' | 'photo' | 'music' | 'video' | 'location',
  content: {
    // text:     { excerpt: 'choose comfort over growth' }
    // photo:    { photoId: 'att-1', data: '...' }
    // music:    { title: '...', artist: '...', url: '...' }
    // video:    { thumbnailUrl: '...', url: '...' }
    // location: { name: '...', lat: 49.84, lng: 24.02 }
  },
  sourceMessageId: 'msg-uuid',     // Back-reference (data integrity only — never shown to user)
  createdAt: 1710700000000
}
```

### Reflection (IndexedDB `reflections` store) — redesigned

```js
{
  id: crypto.randomUUID(),
  fragmentIds: ['frag-1', 'frag-5', 'frag-12'],
  text: 'What the user wrote about this combo',
  createdAt: 1711300000000
}
```

Note: reflections are NO LONGER stored inside messages. They are a separate store linked to fragment combos.

### User (localStorage `mind-diary-user`) — unchanged

```js
{
  name: 'Dmytro',
  language: 'uk',
  onboardingComplete: true,
  createdAt: 1710600000000,
  preferences: { weekStartDay: 'monday' }
}
```

## Fragment extraction engine

Fragments are extracted at the moment a message is saved.

### engine/fragmentExtractor.js

```js
export function extractFragments(message) {
  const fragments = [];

  if (message.text && message.text.trim().length > 0) {
    fragments.push({
      id: crypto.randomUUID(),
      type: 'text',
      content: { excerpt: extractExcerpt(message.text) },
      sourceMessageId: message.id,
      createdAt: message.createdAt
    });
  }

  for (const att of (message.attachments || [])) {
    fragments.push({
      id: crypto.randomUUID(),
      type: att.type,
      content: buildFragmentContent(att),
      sourceMessageId: message.id,
      createdAt: message.createdAt
    });
  }

  return fragments;
}

function extractExcerpt(text) {
  const clauses = text.split(/[.,;!?\—\-\n]+/)
    .map(c => c.trim())
    .filter(c => {
      const words = c.split(/\s+/).length;
      return words >= 3 && words <= 8;
    });

  if (clauses.length === 0) {
    return text.split(/\s+/).slice(0, 8).join(' ');
  }
  return clauses[Math.floor(Math.random() * clauses.length)];
}

function buildFragmentContent(att) {
  switch (att.type) {
    case 'photo':    return { photoId: att.id, data: att.data };
    case 'music':    return { title: att.title, artist: att.artist, url: att.url };
    case 'video':    return { thumbnailUrl: att.thumbnailUrl, url: att.url };
    case 'location': return { name: att.name, lat: att.lat, lng: att.lng };
  }
}
```

## Blur / decay system

### engine/decayCalculator.js

```js
export function getDecayLevel(createdAt, pinned = false) {
  if (pinned) return { blur: 0, opacity: 1.0 };

  const hoursAgo = (Date.now() - createdAt) / (1000 * 60 * 60);

  if (hoursAgo < 24)  return { blur: 0,   opacity: 1.0  };
  if (hoursAgo < 72)  return { blur: 1.5, opacity: 0.85 };
  if (hoursAgo < 168) return { blur: 3,   opacity: 0.7  };
  if (hoursAgo < 720) return { blur: 5,   opacity: 0.5  };
  return                      { blur: 8,   opacity: 0.35 };
}
```

Applied in MessageCard:
```jsx
const decay = getDecayLevel(message.createdAt, message.pinned);
<div style={{ filter: `blur(${decay.blur}px)`, opacity: decay.opacity }}>
```

**What stays sharp**: fragments, pinned entries (premium), reflection text, entry metadata (dates, attachment type indicators).

**Data is never deleted.** Blur is CSS only. Export always produces unblurred data.

## Fragment combination algorithm

### engine/comboGenerator.js

```js
export function generateFragmentCombo(fragments, recentCombos = []) {
  const recentIds = new Set(
    recentCombos.slice(-5).flatMap(c => c.fragmentIds)
  );
  const available = fragments.filter(f => !recentIds.has(f.id));
  if (available.length < 3) return null;

  const comboSize = available.length >= 50 ? randInt(3, 5) :
                    available.length >= 20 ? randInt(3, 4) : 3;

  const byType = groupBy(available, 'type');
  const types = shuffle(Object.keys(byType));
  const selected = [];

  for (const type of types) {
    if (selected.length >= comboSize) break;
    selected.push(randomItem(byType[type]));
  }

  const remaining = available.filter(f => !selected.includes(f));
  while (selected.length < comboSize && remaining.length > 0) {
    const pick = randomItem(remaining);
    selected.push(pick);
    remaining.splice(remaining.indexOf(pick), 1);
  }

  return shuffle(selected);
}
```

## Pool stats and unlock thresholds

### engine/poolStats.js

```js
const UNLOCK_THRESHOLDS = [
  { key: 'basic',      test: (s) => s.total >= 10,          label: 'reflect.unlockBasic' },
  { key: 'visual',     test: (s) => s.byType.photo > 0,     label: 'reflect.unlockVisual' },
  { key: 'sensory',    test: (s) => s.byType.music > 0,     label: 'reflect.unlockSensory' },
  { key: 'placeBased', test: (s) => s.byType.location > 0,  label: 'reflect.unlockPlace' },
  { key: 'rich',       test: (s) => s.total >= 50,          label: 'reflect.unlockRich' },
  { key: 'full',       test: (s) => s.total >= 100,         label: 'reflect.unlockFull' },
];

export function getPoolStats(fragments) {
  const byType = {
    text:     fragments.filter(f => f.type === 'text').length,
    photo:    fragments.filter(f => f.type === 'photo').length,
    music:    fragments.filter(f => f.type === 'music').length,
    video:    fragments.filter(f => f.type === 'video').length,
    location: fragments.filter(f => f.type === 'location').length,
  };
  const total = fragments.length;
  const combos = total >= 3 ? Math.round(total * (total - 1) * (total - 2) / 6) : 0;
  return { byType, total, combos };
}

export function getUnlockedFeatures(stats) {
  return UNLOCK_THRESHOLDS.filter(t => t.test(stats)).map(t => t.key);
}
```

## Internationalization

Unchanged from v2. `useTranslation()` hook + `LanguageProvider`.

### New translation keys for v3

```js
// Added to uk.js
reflect: {
  comboPrompt: 'Що тобі це нагадує?',
  shuffle: 'Інша комбінація',
  poolNeeded: 'Потрібно більше фрагментів для рефлексії',
  unlockBasic: 'Перші рефлексії доступні',
  unlockVisual: 'Візуальні комбінації розблоковано',
  unlockSensory: 'Сенсорні комбінації розблоковано',
  unlockPlace: 'Комбінації з місцями розблоковано',
  unlockRich: 'Глибокі рефлексії розблоковано',
  unlockFull: 'Повний спектр рефлексій',
},
pool: {
  title: 'Твої фрагменти',
  texts: 'Тексти', photos: 'Фото', music: 'Музика',
  videos: 'Відео', locations: 'Місця',
  total: '{count} фрагментів',
  combos: '~{count} можливих комбінацій',
  thisWeek: '+{count} цього тижня',
},
onboarding: {
  blurTitle: 'Записи згасають',
  blurDescription: 'Записи згасають, як і спогади. Але фрагменти — фрази, фото, музика, місця — залишаються чіткими. Це не помилка. Це те, як працює пам\'ять.',
  blurContinue: 'Зрозуміло',
}
```

## Onboarding flow (updated)

```
LANGUAGE_SELECT → NAME_INPUT → BLUR_PHILOSOPHY → JOURNAL
```

The blur philosophy screen is new. It explains that entries fade and fragments survive. Single screen, one button.

## Journal screen

- Pool indicator in app bar (compact bar chart or fragment count)
- Rich inline media rendering (photos full-width, music with album art, location mini-maps)
- Blur applied per entry age
- Minimum viable entry: a single photo with no text
- On save: extract fragments → write to fragments store → recalculate pool → fire unlock toast if threshold crossed

## Reflect screen (redesigned)

- Fragment collage: 3-5 FragmentCard components (text/photo/music/video/location)
- Fragments are NOT labeled with source entry dates
- Compose area: `t('reflect.comboPrompt')`
- Shuffle button for new combo
- Disabled until pool reaches 10 fragments
- Saves to `reflections` store with fragmentIds + user text

## Recall screen (updated)

- Entries render with blur/opacity per decay schedule
- Metadata stays sharp (dates, attachment types)
- Read-only — no inline reflection compose (reflection only through Reflect screen)
- Filters: All / Has reflection / No reflection

## Weekly summary (updated)

```js
function computeWeeklySummary(messages, fragments, reflections) {
  return {
    entriesThisWeek: messages.filter(m => isThisWeek(m.date)).length,
    streak: calcStreak(messages),
    fragmentsTotal: fragments.length,
    fragmentsThisWeek: fragments.filter(f => isThisWeek(new Date(f.createdAt))).length,
    reflectionsTotal: reflections.length,
    possibleCombos: getPoolStats(fragments).combos
  };
}
```

## Data export (updated)

JSON exports all three stores (messages, fragments, reflections). CSV exports messages only (flat format). Export always includes full unblurred data.

## Key implementation rules

1. **No user data leaves the device.** Network calls only for media URL resolution.
2. **No bot, no AI, no recommendation algorithm.** Fragment combos are random, not algorithmic.
3. **Multiple messages per day.** Message feed, timestamped to the minute.
4. **Minimum viable entry is a single photo.** Text is optional. Attachments are first-class.
5. **Ukrainian-first.** All strings via `t()`. No hardcoded text.
6. **Blur is visual only — data is never deleted.** CSS filter+opacity. Export produces unblurred data.
7. **Fragments are permanent.** Never blur or decay. Deleted only if source message is deleted (cascade).
8. **Fragment source is hidden.** Reflect screen never reveals which entry a fragment came from.
9. **Mobile-first.** 375px base, 480px max content width.
10. **Dark mode.** Tailwind `dark:` variants.
11. **Accessible.** Keyboard navigation, focus management.
12. **No AI dependency.** Fragment extraction = string splitting. Combo generation = Math.random(). Deterministic logic only.

## MVP scope

### In scope
- Journal feed with rich media rendering + blur decay
- Fragment extraction on save (text excerpts, photos, music, video, locations)
- Fragment pool with visible stats, type counts, combo count, unlock thresholds
- Association-based reflection (random fragment combos, user writes associations)
- Recall with blur overlay and filters
- Weekly summary (entries, streak, fragments, reflections, combos)
- Data export/import (JSON all stores, CSV messages)
- Settings (name, language, export/import)
- Onboarding with blur philosophy screen
- Ukrainian + English
- Dark mode, PWA

### Out of scope (post-MVP)
- Pin-to-preserve (premium)
- Push notifications / reminders
- Custom themes (premium)
- On This Day resurfacing
- Reflection chains
- Full-text search
- Tags / categories
- Any AI/LLM features
