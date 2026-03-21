# Mind Diary — CLAUDE.md

## Project overview

Mind Diary is a privacy-first journaling app where users write messages to their future self and later reply to their past self. There is no chatbot, no AI, no scripted replies, no questions. You open the app, you write. Days later, your old messages surface and you reply to them from your current perspective.

Primary language: Ukrainian. Secondary: English.

## Tech stack

- **Framework**: React 18+ with Vite (SPA, client-only, no SSR)
- **Routing**: React Router v6 (hash router for static deployment compatibility)
- **State management**: Zustand (lightweight, no boilerplate)
- **Storage**: Browser localStorage + IndexedDB via `idb` library (all data stays on-device, zero network calls)
- **Styling**: Tailwind CSS 3 (utility-first, dark mode built-in)
- **Date handling**: date-fns (tree-shakeable, no moment.js)
- **i18n**: Custom hook + JSON translation files (two languages, no heavy library)
- **Testing**: Vitest + React Testing Library
- **Build**: Vite, output to `dist/`

## Architecture

```
src/
├── app/
│   ├── App.jsx              # Root component, router setup, language provider
│   └── routes.jsx           # Route definitions
├── components/
│   ├── journal/
│   │   ├── MessageFeed.jsx  # Scrollable list of messages with timestamps
│   │   ├── MessageCard.jsx  # Single message display (text + date)
│   │   ├── ComposeBar.jsx   # Bottom-fixed text input + send button
│   │   └── EmptyState.jsx   # Shown when no messages exist yet
│   ├── reflect/
│   │   ├── ReflectCard.jsx  # Past message card with reflection compose area
│   │   └── ReflectionBadge.jsx # Small indicator that a message has been reflected on
│   ├── recall/
│   │   ├── RecallFeed.jsx   # Full message recall with filters
│   │   └── FilterBar.jsx    # All / Unreflected / Reflected toggle
│   ├── summary/
│   │   └── WeeklySummary.jsx # Stats: entries, streak, reflections, ratio
│   └── shared/
│       ├── LanguageSelector.jsx # uk/en toggle
│       └── OnboardingFlow.jsx   # Language → name → journal
├── i18n/
│   ├── uk.js                # Ukrainian translations (primary)
│   ├── en.js                # English translations
│   └── index.js             # LanguageContext provider + useTranslation hook
├── store/
│   ├── useMessageStore.js   # Zustand store for messages (IndexedDB-backed)
│   └── useUserStore.js      # User profile (name, language, preferences)
├── pages/
│   ├── Journal.jsx          # Main screen — message feed + compose
│   ├── Reflect.jsx          # Reflection screen — past message + reply compose
│   ├── Recall.jsx           # Browse all messages with filters
│   ├── Settings.jsx         # Name, language, export
│   └── Onboarding.jsx       # First-launch flow
├── utils/
│   ├── storage.js           # IndexedDB wrapper (idb)
│   ├── exportData.js        # JSON/CSV export
│   └── streak.js            # Streak and weekly stats calculations
└── index.jsx                # Entry point
```

## Core data models

### Message (IndexedDB `messages` store)

```js
{
  id: crypto.randomUUID(),        // Unique identifier
  text: 'Whatever the user wrote', // The journal message
  createdAt: 1710700000000,        // Unix ms timestamp
  date: '2026-03-17',              // ISO date string (derived, for grouping/queries)
  reflection: null | {             // Populated when user reflects on this message
    text: 'Reply to past self...', // The reflection text
    createdAt: 1711300000000       // When the reflection was written
  }
}
```

### User (localStorage `mind-diary-user`)

```js
{
  name: 'Dmytro',
  language: 'uk',                    // 'uk' | 'en'
  onboardingComplete: true,
  createdAt: 1710600000000,
  preferences: {
    weekStartDay: 'monday'           // 'monday' | 'sunday'
  }
}
```

## Internationalization (i18n)

Two languages: Ukrainian (primary) and English (secondary).

### Implementation

```js
// i18n/index.js
import { createContext, useContext } from 'react';
import uk from './uk';
import en from './en';

const translations = { uk, en };
const LanguageContext = createContext('uk');

export function LanguageProvider({ language, children }) {
  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const lang = useContext(LanguageContext);
  const dict = translations[lang] || translations.uk;

  function t(key, vars = {}) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], dict) || key;
    return typeof value === 'string'
      ? value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
      : value;
  }

  return { t, lang };
}
```

### Usage

```jsx
const { t } = useTranslation();
<p>{t('journal.placeholder')}</p>           // → "Напиши щось..."
<p>{t('reflect.originalDate', { date })}</p> // → "Ти написав(ла) 17 березня"
```

### Translation files

Each translation file (`uk.js`, `en.js`) exports a flat-nested object with these top-level keys:
- `app` — app name
- `onboarding` — first-launch strings (namePrompt, welcome)
- `journal` — main screen (placeholder, send, emptyState, today, yesterday)
- `reflect` — reflection screen (title, prompt, placeholder, emptyState, originalDate)
- `recall` — recall screen (title, filterAll, filterUnreflected, filterReflected, reflectionLabel)
- `summary` — weekly summary (title, entriesThisWeek, streak, days, totalReflections, reflectionRatio)
- `settings` — settings screen (all labels, export buttons)
- `common` — shared (save, cancel, skip, done, back)

**All user-facing text must use the `t()` function. No hardcoded strings in components.**

## Onboarding flow

Sequential, not a conversation. No bot messages, no scripted replies.

```
LANGUAGE_SELECT → NAME_INPUT → JOURNAL
```

1. **Language selector**: Two buttons — "Українська" / "English". Stores `user.language`.
2. **Name input**: Single text field with label `t('onboarding.namePrompt')`. Stores `user.name`.
3. **Done**: Sets `user.onboardingComplete = true`, navigates to Journal.

## Journal screen (Home)

A messaging-style feed where the user writes entries.

### Layout
- **Top**: App bar with date/greeting
- **Middle**: Scrollable message feed (newest at bottom, auto-scroll on new message)
- **Bottom**: Fixed compose bar (text input + send button)

### Behavior
- Multiple messages per day allowed (this is a message feed, not one-entry-per-day)
- Messages display with relative timestamps ("Сьогодні 14:32", "Вчора 21:15", "17 бер 2026")
- Empty state shows a warm welcome: `t('journal.emptyState')`
- New message is saved to IndexedDB immediately on send
- No mood selection, no prompts, no questions — just a text input

### ComposeBar component
- Expandable textarea (grows with content, max ~4 lines before scroll)
- Send button (disabled when empty)
- Keyboard shortcut: Ctrl+Enter / Cmd+Enter to send
- After send: clear input, scroll feed to bottom

## Reflection screen

Surfaces old messages and lets the user reply to their past self.

### Entry selection algorithm

```js
function getNextReflectionEntry(messages) {
  return messages
    .filter(m => m.reflection === null)        // Not yet reflected
    .sort((a, b) => a.createdAt - b.createdAt) // Oldest first
    [0];                                        // Take first match
}
```

### Layout
- Past message displayed as a card with original date and text
- Below: compose area labeled `t('reflect.prompt')` — "Відповідь минулому собі"
- Send button saves reflection to `message.reflection`
- After saving: show next available entry, or empty state if none left
- Users can also reflect on any message from Recall by tapping it

### Rules
- One reflection per message (no chains in MVP)
- Oldest unreflected message surfaces first
- Empty state: `t('reflect.emptyState')`

## Recall screen

Browse all past messages with filtering.

### Layout
- Scrollable feed of all messages, newest first
- Each message shows: date, text, and reflection (if exists) in a collapsed/expandable format
- Filter bar at top: All / Unreflected / Reflected (three toggle buttons)
- Tapping an unreflected message navigates to Reflect screen with that message pre-loaded

### Message display
- Original message: plain text + date
- Reflection (if exists): indented or visually differentiated block below the message, with its own date
- Unreflected messages: subtle visual indicator (e.g., dot or border) suggesting they can be reflected on

## Weekly summary

Simple stats, all computed from stored messages.

```js
function computeWeeklySummary(messages) {
  const weekMessages = messages.filter(m => isThisWeek(m.date));
  const allReflected = messages.filter(m => m.reflection !== null);

  return {
    entriesThisWeek: weekMessages.length,
    streak: calcStreak(messages),           // Consecutive days with ≥1 message
    totalReflections: allReflected.length,
    reflectionRatio: messages.length > 0
      ? Math.round((allReflected.length / messages.length) * 100)
      : 0
  };
}
```

## Data export

```js
// utils/exportData.js

export function exportAsJSON(messages) {
  const data = JSON.stringify(messages, null, 2);
  downloadFile(data, 'mind-diary-export.json', 'application/json');
}

export function exportAsCSV(messages) {
  const headers = ['date', 'text', 'reflectionDate', 'reflectionText'];
  const rows = messages.map(m => [
    m.date,
    csvEscape(m.text),
    m.reflection?.createdAt ? new Date(m.reflection.createdAt).toISOString().slice(0, 10) : '',
    csvEscape(m.reflection?.text || '')
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, 'mind-diary-export.csv', 'text/csv');
}

function csvEscape(str) {
  if (!str) return '""';
  return '"' + str.replace(/"/g, '""') + '"';
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

## Settings page

- **Name**: editable text field
- **Language**: uk/en toggle (applying immediately)
- **Export/Import**: export and import buttons with message count

## Key implementation rules

1. **Zero network calls.** No analytics, no telemetry, no API calls. Everything is localStorage + IndexedDB.
2. **No bot, no scripted messages, no AI.** The app never generates text. All text on screen is either user-written or a static UI string from the translation file.
3. **Multiple messages per day.** This is a message feed, not a one-entry-per-day journal. Messages are timestamped to the minute.
4. **Ukrainian-first.** All default text is Ukrainian. Every user-facing string uses `t()` from the i18n system. No hardcoded strings in components.
5. **Mobile-first responsive.** Design for 375px viewport width first. Max content width of 480px centered on desktop.
6. **Dark mode support.** Use Tailwind's `dark:` variants. Respect `prefers-color-scheme`.
7. **Accessible.** All interactive elements must be keyboard-navigable. Focus management on screen transitions. Compose bar accessible via keyboard.
8. **Message feed UX.** Newest messages at bottom (chat-style). Auto-scroll to bottom on new message. Smooth scroll behavior.
9. **One reflection per message.** MVP does not support reflection chains. A message either has no reflection or exactly one.
10. **No AI dependency.** If a feature cannot be implemented with deterministic logic, it is out of MVP scope.

## MVP scope boundaries

### In scope
- Onboarding (language → name)
- Journal feed (write messages, multiple per day, messaging-style UI)
- Reflection (reply to past self, oldest unreflected surfaced first)
- Recall (browse all messages, filter by reflected/unreflected, tap to reflect)
- Weekly summary (entries count, streak, reflections count, reflection ratio)
- Data export (JSON and CSV, in-browser download)
- Settings (name, language, export/import)
- Ukrainian language (primary) + English (secondary)
- Dark mode
- PWA manifest for offline

### Out of scope (post-MVP)
- Custom themes / colors (premium)
- Photo attachments (premium)
- Reflection chains (multiple replies to one message)
- Encouraging quotes
- Tags / categories for messages
- Full-text search
- Any AI/LLM features
