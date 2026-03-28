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
Atoms fade (exponential decay, driven by interaction ticks)
    ↓
User interacts with atoms (tap-to-reveal text, view media) → strengthens them
    ↓
User selects atoms → combines into a molecule → atoms are reinforced
    ↓
Molecules display as navigable stacks (swipe through atoms)
    ↓
Molecule strength = average of its atoms' strengths
    ↓
Faded molecule dissolves → child atoms are reinforced
    ↓
Faded orphan atoms are permanently deleted
```

**The key mechanic**: things fade unless you actively engage with them. Every meaningful action (creating, viewing, combining) ticks all OTHER atoms down by one step, while the atom you interact with gets strengthened. The more you engage, the faster untouched things fade — but the things you care about grow more resilient.

**Strengthening**: each interaction increases an atom's `stability` (flattens the decay curve). First reinforcement: ×1.5, second: ×1.8, third+: ×2.0. Well-reinforced atoms decay much slower.

**Text atoms require tap-to-reveal**: text is slightly blurred until tapped, enforcing intentional reading. After 3 seconds of reading, the atom is strengthened. Media/photo atoms strengthen after 3 seconds of viewing.

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
  content: { /* varies by type */ } | null,

  // --- Composition (molecules only) ---
  childIds: [],               // Atom IDs for molecules

  // --- Timestamps ---
  createdAt: 1710700000000,

  // --- Decay & Strengthening (atoms only) ---
  stability: 12,              // Base decay constant (grows with reinforcement)
  reinforcementCount: 0,      // How many times the atom has been strengthened
  ticksSinceReinforcement: 0, // Interaction ticks since last reinforcement
  lastReinforcedAt: 1710700000000,
}
```

### Constraints

- An **atom** has `type` + `content`, empty `childIds`, and decay fields.
- A **molecule** has `childIds` pointing to atoms, `type` is null. No independent decay — strength = average of atom strengths.
- No stories. No nesting. Molecules are flat.
- A node can be a child of multiple parents (an atom can be in several molecules).
- Dissolving a molecule does NOT delete children (atoms are reinforced and reappear standalone).
- Deleting an atom removes it from all parent `childIds` arrays.
- No `lastInteractedAt`, no `interactionCount`. Only `createdAt` matters for decay.

## Entry decomposition

When the user writes in the Composer and taps send, the entry is decomposed into atoms. The original entry text is NOT stored as a single object — it only exists as its atoms.

```js
const base = { level: 'atom', childIds: [], note: null, createdAt: now };
```

Every sentence becomes its own atom. Very long sentences (>12 words) get split on clause boundaries. Each attachment becomes one atom.

## Decay system

### Exponential decay with interaction ticks

Decay is **exponential**: `strength = e^(-t / stability)` where `t` = ticks since last reinforcement and `stability` grows with each reinforcement.

```js
strength = Math.exp(-ticksSinceReinforcement / stability)
```

### Hybrid tick system

**Interaction ticks (primary):** Every meaningful user action ticks ALL OTHER atoms down by one step. The atom being interacted with does NOT tick down. Meaningful actions include:

- Creating new atoms (composer send)
- Combining atoms into a molecule
- Adding atoms to a molecule
- Tap-to-reveal a text atom (3s dwell)
- Viewing a media/photo atom (3s dwell)
- Navigating within a molecule stack

**Passive time ticks (secondary):** Real-clock-based decay at `1 tick per 4 hours` of inactivity. Applied on app open by comparing current time vs last active timestamp. Ensures abandoned atoms eventually fade (~2-4 weeks of pure inactivity to fully decay).

### Strengthening through interaction

When a user engages with an atom, its `stability` increases:

| Reinforcement # | Stability multiplier |
|---|---|
| 1st | ×1.5 |
| 2nd | ×1.8 |
| 3rd+ | ×2.0 |

Each reinforcement also resets `ticksSinceReinforcement` to 0.

**Text atoms**: render slightly blurred (3px blur, 60% opacity) until tapped. Tap reveals the text; after 3 seconds of reading, the atom is strengthened. This blur is a UI mechanic separate from decay-driven fading.

**Media/photo/location atoms**: strengthen after 3 seconds of viewing.

### Molecule strength

A molecule's displayed strength is the **equal-weighted average** of its child atoms' strengths. No independent molecule decay. No size penalty.

### Selection sharpness

Selecting a node makes it visually sharp (opacity 1, no blur) via the `sharp` CSS prop on `DecayOverlay`. Purely visual — no data mutation.

### Dissolution

- **Molecules**: when average atom strength drops below `DISSOLVE_THRESHOLD` (0.05), the molecule is deleted and its child atoms are reinforced.
- **Atoms**: orphan atoms below the threshold are permanently deleted.
- Dissolution is **event-driven** via Zustand `subscribe`.
- Child atoms of a dissolving molecule are **never** dissolved in the same pass — they are always reinforced first.

### Manual actions in NodeDetail

- **Dissolve molecule**: breaks it into reinforced atoms immediately.
- **Remove atom from molecule**: detaches the atom (reinforced). Only available when molecule has 3+ children.
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

Default sort: `createdAt` ascending with `flex-col-reverse` — newest/sharpest items at the bottom near the composer, oldest/most faded at the top. Messenger-style layout.

### Composer modes

The bottom composer has three modes depending on selection:

| Selection | Mode | Action |
|---|---|---|
| None | Send | Decompose text into atoms |
| 1 item | Add (Plus) | Add new atoms to existing molecule, or combine atom+new into molecule |
| 2+ items | Combine | Create new molecule from selected items |

### Atoms absorbed into molecules

Atoms that are children of any molecule do NOT appear standalone on the canvas. They only render inside their parent molecule's stack.

### Molecule stack rendering

Molecules render as **navigable stacks**, not open containers:

- Shows only the **top atom** (first in `childIds`)
- **Position indicator**: "1/5" shown when molecule has 2+ atoms
- **Swipe** left/right or tap chevrons to navigate through atoms
- Each atom follows its type's interaction rules (text = tap-to-reveal, media = view)
- Navigating away from a text atom re-blurs it
- Swiping through the stack counts as an interaction tick (ticks other atoms)
- Merely swiping past without engaging does NOT strengthen that atom

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
6. **Decay is exponential and tick-driven.** `strength = e^(-t/stability)`. Interaction ticks advance on every user action. Passive ticks accumulate during inactivity (1 tick per 4 hours).
7. **Strengthening through engagement.** Tap-to-reveal text, dwell on media. Each reinforcement increases stability (×1.5, ×1.8, ×2.0) and resets ticks.
8. **Molecule strength = average of atoms.** No size penalty. No independent molecule decay.
9. **Molecules render as stacks.** Show one atom at a time with swipe navigation and position indicator.
10. **Dissolution is real deletion.** Faded molecules break into reinforced atoms. Faded orphan atoms are permanently deleted.
11. **A node can be a child of multiple parents.** An atom can exist in several molecules.
12. **Minimum viable entry is a single photo.** Text is optional.
13. **Ukrainian-first.** All strings via `t()`. No hardcoded text in components.
14. **Mobile-first.** 375px base viewport, 480px max content width.
15. **Dark mode.** Tailwind `dark:` variants. Respect `prefers-color-scheme`.
16. **Event-driven architecture.** Dissolution via Zustand `subscribe`. Passive ticks applied on app open.

## MVP scope

### In scope

- Composer (text + photo/location attachments, three modes: send/add/combine)
- Auto-decomposition of entries into atoms (sentence splitting + per-attachment)
- Canvas: single unified view of all atoms/molecules with exponential decay visualization
- Selection + combine: tap to select, combine into molecule
- Node detail: long-press to expand, retention indicator, dissolve, remove atom
- Tap-to-reveal text atoms + dwell-time strengthening for all atom types
- Molecule stack rendering with swipe navigation
- Exponential decay with interaction ticks + passive time ticks + strengthening
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
