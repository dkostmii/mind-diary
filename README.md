# Mind Diary

A privacy-first journaling app where you write messages to your future self and later reply to your past self. No chatbot, no AI, no scripted replies — you open the app, you write. Days later, your old messages surface and you reply from your current perspective.

Primary language: Ukrainian. Secondary: English.

## Features

- **Message feed journaling** — write multiple messages per day, messaging-style UI
- **Reflection** — reply to your past self on messages 3+ days old
- **History** — browse all messages with filters (all / unreflected / reflected)
- **Weekly summary** — entries count, streak, reflections, reflection ratio
- **Bilingual** — Ukrainian (primary) and English, switchable anytime
- **Push notifications** — local-only daily reminders via service worker
- **Data export** — download all messages as JSON or CSV
- **Dark mode** — respects system preference
- **PWA** — installable, works offline
- **Privacy-first** — zero network calls, all data in localStorage + IndexedDB

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 (hash router) |
| State | Zustand |
| Storage | localStorage + IndexedDB (via `idb`) |
| Styling | Tailwind CSS 3 |
| Dates | date-fns |
| i18n | Custom hook + JSON translation files |
| Testing | Vitest + React Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── app/                    # App shell, routing, language provider
├── components/
│   ├── journal/            # MessageFeed, MessageCard, ComposeBar, EmptyState
│   ├── reflect/            # ReflectCard, ReflectionBadge
│   ├── history/            # HistoryFeed, FilterBar
│   ├── summary/            # WeeklySummary
│   └── shared/             # ReminderModal, LanguageSelector, OnboardingFlow
├── i18n/                   # Ukrainian + English translations, useTranslation hook
├── store/                  # Zustand stores (messages, user)
├── pages/                  # Journal, Reflect, History, Settings, Onboarding
└── utils/                  # IndexedDB wrapper, export, notifications, streak
```

## How It Works

### Journal

A messaging-style feed where you write entries. Multiple messages per day, timestamped to the minute. Newest messages at the bottom with auto-scroll.

### Reflection

Old messages (3+ days, unreflected) surface for reflection. You reply to your past self from your current perspective. One reflection per message.

### Data Storage

All data stays on-device:

- **User profile** — localStorage (`mind-diary-user`)
- **Messages** — IndexedDB (`mind-diary` database), multiple per day
- **No session state** — stateless UI, no conversation engine

## License

ISC
