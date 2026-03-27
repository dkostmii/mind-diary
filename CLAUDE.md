# Mind Diary — CLAUDE.md

## Project overview

Mind Diary is a memory app built on a fractal model of knowledge. You write — the app decomposes your entry into **atoms** (individual fragments: a phrase, a photo, a song, a location, a link). Atoms fade over time. To keep knowledge alive, you combine atoms into **molecules**. Each act of combining makes the touched atoms sharp again and reveals how your thinking connects.

There are only two levels: **atoms** and **molecules**. No stories, no nesting. Molecules are flat collections of atoms.

There is no chatbot, no AI, no recommendation engine. The user does all the thinking.

Primary language: Ukrainian. Secondary: English.

## Core concept

```
Write an entry
    ↓
Entry decomposes into atoms
    ↓
Atoms fade (linear decay, driven by composer frequency)
    ↓
User selects atoms → combines into a molecule
    ↓
Molecules fade (faster if they contain more atoms)
    ↓
Faded molecule dissolves → child atoms become sharp again
    ↓
Faded orphan atoms are permanently deleted
```

**The key mechanic**: things fade unless you actively create new content. The more you write, the faster old things fade. Combining atoms into molecules makes them sharp — but only at the moment of combination. The app doesn't tell you what to combine — you see your fading atoms and decide what belongs together. That decision IS the reflection.

**Anti-hoarding**: larger molecules decay faster (`lifetime / (1 + log2(childCount))`). A focused 2-3 atom molecule stays bright. A dump-everything molecule of 15 atoms fades fast, encouraging the user to organize into smaller, meaningful groups.

## Tech stack

- **Framework**: React 18+ with Vite (SPA, client-only, no SSR)
- **Routing**: React Router v6 (hash router)
- **State management**: Zustand
- **Storage**: IndexedDB via `idb` (all data local, zero network calls for user data)
- **Styling**: Tailwind CSS 3
- **Date handling**: date-fns
- **i18n**: Custom hook + translation files (Ukrainian primary, English secondary)
- **Testing**: Vitest + React Testing Library
- **Build**: Vite → `dist/`

## Architecture

```
src/
├── app/
│   ├── App.jsx                 # Root: router, language provider, atom loader
│   └── routes.jsx
├── components/
│   ├── canvas/
│   │   ├── Canvas.jsx          # Main view: renders all nodes with decay
│   │   ├── AtomChip.jsx        # Renders a single atom (text/photo/music/video/location/link)
│   │   ├── MoleculeCard.jsx    # Renders a molecule (its child atoms inline)
│   │   └── DecayOverlay.jsx    # Applies blur + dim based on node decay; supports `sharp` prop
│   ├── composer/
│   │   └── Composer.jsx        # Bottom-fixed input: three modes (send/add/combine)
│   ├── combine/
│   │   ├── SelectionBar.jsx    # Appears when 1+ items selected
│   │   └── LinkSheet.jsx       # Bottom sheet: link existing node to another
│   ├── detail/
│   │   └── NodeDetail.jsx      # Expanded view: retention bar, dissolve, remove atom
│   ├── onboarding/
│   │   ├── OnboardingFlow.jsx  # Guided walkthrough with branching (single-atom path)
│   │   ├── StepWrite.jsx       # Write entry (supports promptKey for reuse)
│   │   ├── StepAtoms.jsx       # See atoms + fade demo (skipFadeDemo prop)
│   │   ├── StepCombine.jsx     # Combine atoms into molecule
│   │   ├── StepDetail.jsx      # Long-press to open details (readOnly)
│   │   ├── StepFade.jsx        # Molecule dissolution demo (visual only)
│   │   └── StepDone.jsx        # Completion
│   └── shared/
│       ├── Composer.jsx         # Shared composer UI (text + photo + location)
│       ├── LanguageSelector.jsx
│       └── EmptyState.jsx
├── i18n/
│   ├── uk.js
│   ├── en.js
│   └── index.js                # LanguageContext + useTranslation
├── store/
│   ├── useNodeStore.js         # Zustand: all nodes (atoms, molecules)
│   ├── useSelectionStore.js    # Zustand: current multi-select state
│   └── useUserStore.js         # User profile + onboarding progress
├── engine/
│   ├── decompose.js            # Decompose entry text + attachments into atoms
│   ├── decay.js                # Linear decay, composer-frequency-driven lifetime
│   └── stats.js                # Atom/molecule counts, alive ratio
├── pages/
│   ├── Main.jsx                # Single main screen: canvas + composer
│   ├── Settings.jsx            # Name, language, export/import
│   └── Onboarding.jsx          # First-launch guided flow
├── utils/
│   ├── storage.js              # IndexedDB wrapper
│   └── exportData.js           # JSON export (all nodes)
└── index.jsx
```

## Data model

Everything is a **Node**. The `level` field determines its scale: `atom` or `molecule`.

### Node (IndexedDB `nodes` store)

```js
{
  id: crypto.randomUUID(),

  level: 'atom' | 'molecule',

  // --- Content (atoms only) ---
  type: 'text' | 'photo' | 'music' | 'video' | 'location' | 'link' | null,
  content: {
    // text:     { excerpt: 'choose comfort over growth' }
    // photo:    { data: '...base64 or blob ref...' }
    // music:    { title: '...', artist: '...', url: '...' }
    // video:    { thumbnailUrl: '...', url: '...' }
    // location: { name: '...', lat: 49.84, lng: 24.02 }
    // link:     { url: '...', title: '...' }
  } | null,

  // --- Composition (molecules only) ---
  childIds: [],               // Atom IDs for molecules

  // --- Decay ---
  createdAt: 1710700000000,   // Stamped to Date.now() when used in composer
}
```

### Constraints

- An **atom** has `type` + `content`, empty `childIds`.
- A **molecule** has `childIds` pointing to atoms, `type` is null.
- No stories. No nesting. Molecules are flat.
- A node can be a child of multiple parents (an atom can be in several molecules).
- Dissolving a molecule does NOT delete children (atoms become sharp and reappear standalone).
- Deleting an atom removes it from all parent `childIds` arrays.
- No `lastInteractedAt`, no `interactionCount`. Only `createdAt` matters for decay.

## Entry decomposition

When the user writes in the Composer and taps send, the entry is decomposed into atoms. The original entry text is NOT stored as a single object — it only exists as its atoms.

```js
const base = { level: 'atom', childIds: [], note: null, createdAt: now };
```

Every sentence becomes its own atom. Very long sentences (>12 words) get split on clause boundaries. Each attachment becomes one atom.

## Decay system

### Linear decay, composer-frequency-driven

Decay is **linear** (not exponential). Retention goes from 100% to 0% over a predictable `lifetime`.

```js
retention = max(0, 1 - elapsed / effectiveLifetime)
```

### Lifetime derivation

The lifetime is derived from the user's composer operation frequency:

```
lifetime = median_gap_between_composer_operations × 6
```

- Needs ≥2 composer operations to produce a real value
- Before 2 operations: `DEFAULT_LIFETIME = 9999` (effectively no fading)
- Upper bound: `MAX_LIFETIME = 336` hours (14 days)

### Discrete decay steps

Decay does NOT advance continuously with `Date.now()`. Instead, it's measured against the **last composer operation timestamp**:

```js
const anchor = getLastComposerTimestamp() ?? node.createdAt;
const elapsed = max(0, anchor - node.createdAt);
```

This means decay only visually updates when the user submits something in the composer. Between operations, everything stays at its current retention level.

### Molecule size penalty

Larger molecules decay faster to discourage hoarding:

```js
const sizePenalty = childCount > 1 ? 1 + Math.log2(childCount) : 1;
const effectiveLifetime = lifetime / sizePenalty;
```

| Atoms in molecule | Lifetime multiplier |
|---|---|
| 1-2 | 1x |
| 4 | ~0.7x |
| 8 | ~0.5x |
| 16 | ~0.33x |

### Selection sharpness

Selecting a node makes it visually sharp (opacity 1, no blur) via the `sharp` CSS prop on `DecayOverlay`. This is purely visual — no data mutation. On deselect, the node returns to its current decay state.

### What makes a node sharp (stamps `createdAt = Date.now()`)

| Action | What becomes sharp |
|---|---|
| Creating atoms via composer | The new atoms |
| Combining atoms into a molecule | All child atoms + the new molecule |
| Adding atoms to an existing molecule | The parent + added children |
| Molecule dissolution (auto or manual) | Released child atoms |
| Removing an atom from a molecule | The detached atom |

### What does NOT make nodes sharp

- Selecting / deselecting (visual only)
- Viewing node detail (passive, read-only)
- Scrolling past a node in the canvas

### Dissolution

- **Molecules**: when retention drops below `DISSOLVE_THRESHOLD` (0.05), the molecule is deleted and its child atoms are stamped sharp (`createdAt = now`).
- **Atoms**: orphan atoms (no live parent molecule) below the threshold are permanently deleted from IndexedDB.
- Dissolution is **event-driven** via Zustand `subscribe` — triggered on every store change, no polling/intervals.
- Child atoms of a dissolving molecule are **never** dissolved in the same pass — they are always stamped sharp first.

### Manual actions in NodeDetail

- **Dissolve molecule**: breaks it into sharp atoms immediately.
- **Remove atom from molecule**: detaches the atom (becomes standalone and sharp). Only available when molecule has 2+ children.
- **Dissolve atom**: deletes the atom with a fade-out animation.
- During **onboarding**, these actions are hidden (`readOnly` prop).

### Retention indicator

NodeDetail shows a color-coded retention bar: green >50%, yellow 20-50%, red <20%.

## The canvas (main screen)

One screen. Everything lives here.

### Layout

```
┌─────────────────────────────┐
│  App bar: "Mind Diary" + ⚙  │
├─────────────────────────────┤
│                             │
│  Canvas: all nodes, sorted  │
│  by createdAt desc          │
│                             │
│  Atoms = small chips        │
│  Molecules = medium cards   │
│                             │
│  Everything has decay       │
│  overlay (blur + opacity)   │
│                             │
│  Tap = select (multi)       │
│  Long-press = view detail   │
│                             │
├─────────────────────────────┤
│  [Selection bar if active]  │
│  "3 selected" [Combine] btn │
├─────────────────────────────┤
│  Composer: text + attach    │
└─────────────────────────────┘
```

### Sorting

Default sort: `createdAt` descending (most recently created/refreshed at top).

### Composer modes

The bottom composer has three modes depending on selection:

| Selection | Mode | Action |
|---|---|---|
| None | Send | Decompose text into atoms |
| 1 item | Add (Plus) | Add new atoms to existing molecule, or combine atom+new into molecule |
| 2+ items | Combine | Create new molecule from selected items |

### Atoms absorbed into molecules

Atoms that are children of any molecule do NOT appear standalone on the canvas. They only render inside their parent molecule card.

## Guided onboarding

Interactive walkthrough with branching based on atom count.

### Flow

```
LANGUAGE → NAME → WRITE → ATOMS (+ fade demo)
  ├─ if 1 atom:  WRITE_MORE → ATOMS_MORE → COMBINE_A → ...
  ├─ if 2-3:     COMBINE_A → DETAIL_A → FADE → DONE
  └─ if 4+:      COMBINE_A → DETAIL_A → COMBINE_B → COMBINE_MOLECULES → FADE → DONE
```

### Key steps

- **LANGUAGE**: App icon, "Mind Diary", tagline "Keep your thoughts alive", language selector
- **ATOMS**: Shows atoms, then animates them fading away to teach decay
- **WRITE_MORE**: If only 1 atom, asks user to write more (fade demo already shown, not repeated)
- **DETAIL_A**: Teaches long-press to open details (`readOnly` — no dissolve/remove buttons)
- **FADE**: Visual demo of molecule dissolution → atoms reappear sharp (no actual store changes)

## Loading screen

Animated loader with two atoms ("Mind", "Diary") that fade and reappear in a staggered loop, mimicking the app's core mechanic. Minimum display time: 2 seconds.

## Key implementation rules

1. **No user data leaves the device.** No analytics, no telemetry.
2. **No bot, no AI, no recommendation engine.** Decomposition is deterministic string splitting. The user decides what to combine.
3. **Everything is a node.** Atoms and molecules share one data model and one IndexedDB store.
4. **Only two levels: atoms and molecules.** No stories, no nesting. Molecules are flat.
5. **Original entry text is not preserved as a unit.** It exists only as its decomposed atoms.
6. **Decay is linear and composer-driven.** `retention = 1 - elapsed/lifetime`. Lifetime derived from median gap between composer operations × 6. Decay advances in discrete steps (each composer use), not continuously.
7. **Dissolution is real deletion.** Faded molecules break into sharp atoms. Faded orphan atoms are permanently deleted. Export reflects current state.
8. **Larger molecules fade faster.** `effectiveLifetime = lifetime / (1 + log2(childCount))`. Encourages focused, small molecules.
9. **A node can be a child of multiple parents.** An atom can exist in several molecules.
10. **Minimum viable entry is a single photo.** Text is optional.
11. **Ukrainian-first.** All strings via `t()`. No hardcoded text in components.
12. **Mobile-first.** 375px base viewport, 480px max content width.
13. **Dark mode.** Tailwind `dark:` variants. Respect `prefers-color-scheme`.
14. **Event-driven architecture.** No polling, no intervals, no 60-second ticks. Dissolution via Zustand `subscribe`. Decay is a pure function of timestamps.

## MVP scope

### In scope

- Composer (text + photo/location attachments, three modes: send/add/combine)
- Auto-decomposition of entries into atoms (sentence splitting + per-attachment)
- Canvas: single unified view of all atoms/molecules with linear decay visualization
- Selection + combine: tap to select, combine into molecule
- Node detail: long-press to expand, retention indicator, dissolve, remove atom
- Linking: add existing atoms into an existing molecule
- Linear decay (blur + opacity based on composer frequency)
- Guided onboarding with branching (write → see atoms fade → combine → molecule dissolution demo)
- Data export/import (JSON)
- Settings (name, language, export/import)
- Ukrainian + English
- Dark mode
- PWA manifest
- Animated loading screen

### Out of scope (post-MVP)

- Pin-to-preserve (premium — exempt a node from decay)
- Push notifications / reminders
- Custom themes (premium)
- Full-text search across atoms
- On This Day resurfacing (same calendar date, previous years)
- Activity analytics / stats dashboard
- Tags / categories
- Any AI/LLM features
