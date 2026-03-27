# Mind Diary — CLAUDE.md

## Project overview

Mind Diary is a memory app built on a fractal model of knowledge. You write — the app decomposes your entry into **atoms** (individual fragments: a phrase, a photo, a song, a location, a link). Atoms fade over time, following the natural human forgetting curve. To keep knowledge alive, you combine atoms into **molecules**. Combine molecules and you get **stories**. Each act of combining refreshes what you touched and reveals how your thinking connects.

The same pattern at every scale: small pieces compose into larger structures, and larger structures are themselves pieces of even larger ones. Like fractals. Like reality.

There is no chatbot, no AI, no recommendation engine. The user does all the thinking.

Primary language: Ukrainian. Secondary: English.

## Core concept

```
Write an entry
    ↓
Entry decomposes into atoms
    ↓
Atoms slowly fade (forgetting curve)
    ↓
User selects atoms → combines into a molecule (+ optional note)
    ↓
Molecules slowly fade
    ↓
User selects molecules → combines into a story (+ optional note)
    ↓
Stories slowly fade
    ↓
Every interaction (combine, annotate, view, link) refreshes decay
```

**The key mechanic**: things fade unless you actively engage with them. Combining is the engagement. The app doesn't tell you what to combine — you see your fading atoms and decide what belongs together. That decision IS the reflection. The app just provides the raw material and the fading pressure.

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
│   ├── App.jsx                 # Root: router, language provider
│   └── routes.jsx
├── components/
│   ├── canvas/
│   │   ├── Canvas.jsx          # Main view: renders all nodes with decay
│   │   ├── AtomChip.jsx        # Small: renders a single atom (text/photo/music/video/location/link)
│   │   ├── MoleculeCard.jsx    # Medium: renders a molecule (its atoms + optional note)
│   │   ├── StoryCard.jsx       # Large: renders a story (its children + optional note)
│   │   └── DecayOverlay.jsx    # Applies blur + dim based on node decay
│   ├── composer/
│   │   ├── Composer.jsx        # Bottom-fixed input: text + attachment buttons + send
│   │   └── AttachmentPicker.jsx # Photo/music/video/location/link attachment UI
│   ├── combine/
│   │   ├── SelectionBar.jsx    # Appears when atoms/molecules are selected
│   │   ├── CombineSheet.jsx    # Bottom sheet: shows selected items + note input + confirm
│   │   └── LinkSheet.jsx       # Bottom sheet: link existing node to another + add info
│   ├── detail/
│   │   └── NodeDetail.jsx      # Expanded view of a molecule/story showing its children
│   ├── onboarding/
│   │   ├── OnboardingFlow.jsx  # Guided walkthrough: write → atoms → combine → fade
│   │   ├── StepWrite.jsx       # Step 1: write your first entry
│   │   ├── StepAtoms.jsx       # Step 2: see it decompose
│   │   ├── StepCombine.jsx     # Step 3: combine atoms
│   │   ├── StepFade.jsx        # Step 4: understand decay
│   │   └── StepDone.jsx        # Step 5: you're ready
│   └── shared/
│       ├── LanguageSelector.jsx
│       └── EmptyState.jsx
├── i18n/
│   ├── uk.js
│   ├── en.js
│   └── index.js                # LanguageContext + useTranslation
├── store/
│   ├── useNodeStore.js         # Zustand: all nodes (atoms, molecules, stories)
│   ├── useSelectionStore.js    # Zustand: current multi-select state
│   └── useUserStore.js         # User profile + onboarding progress
├── engine/
│   ├── decompose.js            # Decompose entry text + attachments into atoms
│   ├── decay.js                # Compute decay (blur + opacity) from forgetting curve
│   └── stats.js                # Atom/molecule/story counts, activity metrics
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

Everything is a **Node**. The `level` field determines its scale.

### Node (IndexedDB `nodes` store)

```js
{
  id: crypto.randomUUID(),

  level: 'atom' | 'molecule' | 'story',

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

  // --- Composition (molecules and stories) ---
  childIds: [],               // Atom IDs for molecules, molecule/atom IDs for stories
  note: '' | null,            // User's annotation when combining ("why these belong together")

  // --- Decay ---
  createdAt: 1710700000000,
  lastInteractedAt: 1710700000000,  // Updated on: create, combine into, view detail, annotate
  interactionCount: 1,              // Incremented on each interaction. Affects decay rate.
}
```

### Constraints

- An **atom** has `type` + `content`, empty `childIds`, no `note`.
- A **molecule** has `childIds` pointing to atoms, optional `note`, `type` is null.
- A **story** has `childIds` pointing to molecules and/or atoms, optional `note`, `type` is null.
- A node can be a child of multiple parents (an atom can be in several molecules).
- Deleting a parent does NOT delete children (atoms persist independently).
- Deleting an atom removes it from all parent `childIds` arrays.

### User (localStorage `mind-diary-user`)

```js
{
  name: 'Dmytro',
  language: 'uk',
  onboardingComplete: false,
  onboardingStep: 0,             // Tracks guided onboarding progress (0-5)
  createdAt: 1710600000000,
  preferences: {
    weekStartDay: 'monday'
  }
}
```

## Entry decomposition

When the user writes in the Composer and taps send, the entry is decomposed into atoms. The original entry text is NOT stored as a single object — it only exists as its atoms.

### engine/decompose.js

```js
export function decomposeEntry(text, attachments = []) {
  const atoms = [];
  const now = Date.now();
  const base = { level: 'atom', childIds: [], note: null,
                 createdAt: now, lastInteractedAt: now, interactionCount: 1 };

  // 1. Text → split into sentence/clause atoms
  if (text && text.trim()) {
    const excerpts = extractExcerpts(text);
    for (const excerpt of excerpts) {
      atoms.push({
        ...base,
        id: crypto.randomUUID(),
        type: 'text',
        content: { excerpt }
      });
    }
  }

  // 2. Each attachment → one atom
  for (const att of attachments) {
    atoms.push({
      ...base,
      id: crypto.randomUUID(),
      type: att.type,
      content: buildContent(att)
    });
  }

  return atoms;
}

function extractExcerpts(text) {
  // Split on sentence boundaries
  const sentences = text
    .split(/(?<=[.!?…])\s+|(?<=\n)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) return [text.trim()];

  // Each sentence becomes its own atom.
  // Very long sentences (>12 words) get split on clause boundaries.
  const results = [];
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).length;
    if (words <= 12) {
      results.push(sentence);
    } else {
      // Split on clause boundaries, keep 3-12 word chunks
      const clauses = sentence.split(/[,;:\—\-–]/)
        .map(c => c.trim())
        .filter(c => c.split(/\s+/).length >= 2);
      if (clauses.length > 1) {
        results.push(...clauses);
      } else {
        results.push(sentence);
      }
    }
  }
  return results;
}

function buildContent(att) {
  switch (att.type) {
    case 'photo':    return { data: att.data };
    case 'music':    return { title: att.title, artist: att.artist, url: att.url };
    case 'video':    return { thumbnailUrl: att.thumbnailUrl, url: att.url };
    case 'location': return { name: att.name, lat: att.lat, lng: att.lng };
    case 'link':     return { url: att.url, title: att.title || '' };
  }
}
```

**Key change from v3**: every sentence becomes its own atom (not just one random excerpt per entry). The user's full thought is preserved — but as a collection of independent pieces, not a monolithic block.

## Decay system (forgetting curve)

Decay follows a simplified Ebbinghaus forgetting curve. Each node has its own decay based on when it was last interacted with and how many times it's been touched.

### engine/decay.js

```js
// Base half-life in hours: how long until a node reaches ~50% visibility
// with no interactions beyond creation.
const BASE_HALF_LIFE = 48; // 2 days

export function getDecay(node) {
  const hoursSinceInteraction =
    (Date.now() - node.lastInteractedAt) / (1000 * 60 * 60);

  // Stability increases with interactions (logarithmic, diminishing returns)
  // 1 interaction = 1x, 3 = ~2x, 7 = ~2.9x, 15 = ~3.7x
  const stability = 1 + Math.log2(node.interactionCount);

  // Effective half-life scales with stability
  const effectiveHalfLife = BASE_HALF_LIFE * stability;

  // Exponential decay: retention = 2^(-t/halfLife)
  const retention = Math.pow(2, -hoursSinceInteraction / effectiveHalfLife);

  // Map retention (0-1) to visual properties
  // retention 1.0 = fully sharp, retention 0.0 = nearly invisible
  const opacity = Math.max(0.12, retention);
  const blur = Math.max(0, (1 - retention) * 8);

  return { opacity, blur, retention };
}

// Call this whenever a user interacts with a node
export function refreshNode(node) {
  return {
    ...node,
    lastInteractedAt: Date.now(),
    interactionCount: node.interactionCount + 1
  };
}
```

### What counts as an interaction (refreshes decay)

| Action | Refreshes |
|--------|-----------|
| Creating a node | The new node |
| Combining atoms into a molecule | All selected atoms + the new molecule |
| Combining molecules into a story | All selected molecules + the new story |
| Adding a note to an existing node | That node |
| Linking a node into a new combination | The linked node + the new parent |
| Viewing a node's detail (expanding it) | That node |

### What does NOT refresh

- Scrolling past a node in the canvas (passive viewing doesn't count)
- Seeing a node inside a parent's detail view (only the parent refreshes)

## The canvas (main screen)

One screen. Everything lives here.

### Layout

```
┌─────────────────────────────┐
│  App bar: "Mind Diary" + ⚙  │
├─────────────────────────────┤
│                             │
│  Canvas: all nodes, sorted  │
│  by lastInteractedAt desc   │
│                             │
│  Atoms = small chips        │
│  Molecules = medium cards   │
│  Stories = large cards      │
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

### Visual hierarchy

| Level | Rendering | Size |
|-------|-----------|------|
| Atom (text) | Chip/pill with the excerpt text | Small, inline, wrapping |
| Atom (photo) | Thumbnail image | ~80px square |
| Atom (music) | Compact card: album art + title | Small card |
| Atom (video) | Compact card: thumbnail | Small card |
| Atom (location) | Compact card: place name + mini pin | Small card |
| Atom (link) | Compact card: favicon + title + URL | Small card |
| Molecule | Card containing its child atoms rendered inside + optional note | Medium card |
| Story | Larger card containing its child molecules/atoms + optional note | Large card |

### Sorting

Default sort: `lastInteractedAt` descending (most recently touched at top). This means freshly created or recently combined items float up, while neglected items sink and fade.

### Selection mode

- **Tap** an atom or molecule to toggle its selection (highlight border, checkmark).
- When 2+ items are selected, the **SelectionBar** appears above the Composer.
- SelectionBar shows count + "Об'єднати" (Combine) button.
- Tapping Combine opens the **CombineSheet**.
- Selecting only atoms → creates a molecule. Selecting any molecules → creates a story. Selecting a mix → creates a story.
- **Cancel** button clears selection.

### CombineSheet (bottom sheet)

1. Shows the selected items as a preview (mini versions).
2. Optional text input: "Додай нотатку..." ("Add a note...") — the user can explain WHY these belong together, or leave it empty.
3. "Об'єднати" (Combine) button → creates the new molecule/story node, refreshes all children, closes sheet.
4. The note, if provided, also becomes a text atom that is automatically added as a child of the new node.

### Linking to existing nodes

- Long-press a node → opens **NodeDetail** (expanded view showing its children if molecule/story, or just the content if atom).
- In NodeDetail, there is a "Додати сюди" ("Add here") button.
- Tapping "Add here" enters a selection mode where the user picks other atoms/molecules to link into this node.
- Selected items are added to the node's `childIds`. All touched nodes refresh.
- The user can also type a new note that gets added as a new text atom child.

### Canvas empty state

Before any entries: warm welcome `t('canvas.emptyState')` — "Напиши першу думку. Вона розкладеться на атоми."

## Composer

Fixed at the bottom of the Main screen. Always accessible.

- Expandable textarea (grows to ~4 lines, then scrolls)
- Attachment bar: buttons for photo, music/audio, video, location, link
- Send button (disabled when empty and no attachments)
- Keyboard shortcut: Ctrl+Enter / Cmd+Enter to send
- On send:
  1. `decomposeEntry(text, attachments)` produces atom nodes
  2. Atoms are written to `nodes` store
  3. Atoms appear in the canvas with full opacity (freshly created)
  4. Composer clears
  5. Canvas scrolls to top (newest items)

## Node detail view

Long-press any node → expands to a detail view (could be a modal, a bottom sheet, or an inline expansion — pick the simplest).

**Atom detail**: shows the full content (full-size photo, playable music/video, map for location, link preview). Shows creation date. "Додати сюди" button is hidden (atoms have no children).

**Molecule detail**: shows all child atoms rendered at full clarity (regardless of their individual decay — viewing the parent refreshes it, and seeing the children in context is the point). Shows the note if present. "Додати сюди" button to link more atoms. Shows creation date.

**Story detail**: shows all child molecules and atoms rendered at full clarity. Shows the note if present. "Додати сюди" button to link more. Shows creation date.

**Viewing detail counts as an interaction** → refreshes that node's decay.

## Guided onboarding

The onboarding is an interactive walkthrough, not just info screens. The user performs real actions in a guided context.

### Flow

```
LANGUAGE_SELECT → NAME_INPUT → STEP_WRITE → STEP_ATOMS → STEP_COMBINE → STEP_FADE → STEP_DONE → MAIN
```

### Steps

**Step 0: Language + name**
- Language selector: "Українська" / "English"
- Name input: `t('onboarding.namePrompt')` — "Як тебе звати?"
- Continue button

**Step 1: Write** (`StepWrite`)
- Screen shows a Composer with a prompt: `t('onboarding.writePrompt')` — "Напиши щось про свій день. Що завгодно."
- User types and sends their first entry.
- The entry text stays on screen for a moment.
- Continue button or auto-advance after send.

**Step 2: See atoms** (`StepAtoms`)
- The entry text animates/transitions into its decomposed atoms.
- Brief explanation: `t('onboarding.atomsExplain')` — "Твій запис розклався на атоми — окремі думки, фрази, медіа. Кожен атом живе самостійно."
- Atoms appear as chips, highlighted.
- Continue button.

**Step 3: Combine** (`StepCombine`)
- Prompt: `t('onboarding.combinePrompt')` — "Обери кілька атомів і об'єднай їх. Це створить молекулу — зв'язок між думками."
- User selects 2+ atoms from the ones just created.
- Combine button appears. User taps it.
- Optional note input shown. User can type or skip.
- Molecule appears. Brief explanation: `t('onboarding.moleculeExplain')` — "Молекула — це група атомів, які ти зв'язав(ла). Кожне об'єднання оновлює їх, не даючи згаснути."
- Continue button.

**Step 4: Understand fade** (`StepFade`)
- Visual demo: the atoms that were NOT combined begin to dim/blur slightly (accelerated for demo purposes).
- The combined molecule stays bright.
- Explanation: `t('onboarding.fadeExplain')` — "Атоми згасають з часом, як справжні спогади. Об'єднання та взаємодія тримають їх яскравими. Те, що важливо — ти збережеш. Решта згасне."
- Continue button.

**Step 5: Done** (`StepDone`)
- `t('onboarding.doneMessage')` — "Ти готовий/готова. Пиши, об'єднуй, будуй. Атоми → молекули → історії."
- "Почати" ("Start") button → sets `onboardingComplete = true`, navigates to Main.

## Decay visualization

All nodes in the canvas render with a `DecayOverlay` component:

```jsx
function DecayOverlay({ node, children }) {
  const { opacity, blur } = getDecay(node);
  return (
    <div style={{
      opacity,
      filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
      transition: 'opacity 0.5s, filter 0.5s'
    }}>
      {children}
    </div>
  );
}
```

Decay recalculates on each render (it's a pure function of current time vs node timestamps). No timers needed — just re-render periodically or on user interaction.

To keep the canvas feeling alive, set a `setInterval` that triggers a lightweight re-render every 60 seconds so decay visually progresses even while the user is looking at the screen.

## Activity metrics

### engine/stats.js

```js
export function getStats(nodes) {
  const atoms = nodes.filter(n => n.level === 'atom');
  const molecules = nodes.filter(n => n.level === 'molecule');
  const stories = nodes.filter(n => n.level === 'story');

  // Alive = retention > 0.5 (more visible than not)
  const aliveAtoms = atoms.filter(n => getDecay(n).retention > 0.5).length;
  const aliveMolecules = molecules.filter(n => getDecay(n).retention > 0.5).length;

  return {
    totalAtoms: atoms.length,
    totalMolecules: molecules.length,
    totalStories: stories.length,
    aliveAtoms,
    aliveMolecules,
    // How much of the user's knowledge is still "alive"
    aliveRatio: atoms.length > 0
      ? Math.round((aliveAtoms / atoms.length) * 100) : 0
  };
}
```

These stats can be shown in Settings or as a compact indicator in the app bar. Not a primary feature — the canvas itself IS the visualization.

## Internationalization

Same `useTranslation()` hook as before. New keys:

```js
// uk.js
export default {
  app: { name: 'Mind Diary' },

  onboarding: {
    namePrompt: "Як тебе звати?",
    writePrompt: "Напиши щось про свій день. Що завгодно.",
    atomsExplain: "Твій запис розклався на атоми — окремі думки, фрази, медіа. Кожен атом живе самостійно.",
    combinePrompt: "Обери кілька атомів і об'єднай їх.",
    moleculeExplain: "Молекула — це група атомів, які ти зв'язав(ла). Кожне об'єднання оновлює їх, не даючи згаснути.",
    fadeExplain: "Атоми згасають з часом, як справжні спогади. Об'єднання та взаємодія тримають їх яскравими.",
    doneMessage: "Ти готовий/готова. Пиши, об'єднуй, будуй.",
    start: "Почати",
  },

  canvas: {
    emptyState: "Напиши першу думку. Вона розкладеться на атоми.",
  },

  composer: {
    placeholder: "Напиши щось...",
    send: "Надіслати",
  },

  combine: {
    title: "Об'єднати",
    notePlaceholder: "Додай нотатку...",
    confirm: "Об'єднати",
    cancel: "Скасувати",
    selected: "{count} обрано",
    resultMolecule: "Нова молекула",
    resultStory: "Нова історія",
  },

  detail: {
    addHere: "Додати сюди",
    created: "Створено {date}",
    interactions: "{count} взаємодій",
  },

  levels: {
    atom: "Атом",
    molecule: "Молекула",
    story: "Історія",
  },

  settings: {
    title: "Налаштування",
    name: "Ім'я",
    language: "Мова",
    exportJSON: "Експорт даних",
    importJSON: "Імпорт даних",
    nodeCount: "{count} вузлів",
    resetOnboarding: "Пройти онбординг знову",
  },

  common: {
    save: "Зберегти",
    cancel: "Скасувати",
    done: "Готово",
    back: "Назад",
  }
};
```

## Data export

```js
export function exportAsJSON(nodes) {
  const data = JSON.stringify(nodes, null, 2);
  downloadFile(data, 'mind-diary-export.json', 'application/json');
}

export function importFromJSON(jsonString, nodeStore) {
  const nodes = JSON.parse(jsonString);
  nodeStore.importNodes(nodes);
}
```

Single store, single export. No separate fragment/reflection stores — everything is a node.

## Settings page

- **Name**: editable text field
- **Language**: uk/en toggle
- **Export**: download all nodes as JSON
- **Import**: upload JSON to restore
- **Node count**: total atoms / molecules / stories
- **Reset onboarding**: re-run the guided walkthrough

## Key implementation rules

1. **No user data leaves the device.** Network calls only for media URL resolution (oEmbed). No analytics, no telemetry.
2. **No bot, no AI, no recommendation engine.** Decomposition is deterministic string splitting. There is no algorithm deciding what to show — the canvas shows everything, sorted by recency. The user decides what to combine.
3. **Everything is a node.** Atoms, molecules, stories share one data model and one IndexedDB store. The `level` field is the only differentiator.
4. **Original entry text is not preserved as a unit.** It exists only as its decomposed atoms. This is intentional — the app mirrors how memory fragments, not how notebooks archive.
5. **Decay is visual only.** Underlying data is never deleted by decay. Export always produces full data. Nodes only disappear when the user explicitly deletes them.
6. **Interactions refresh decay.** Every meaningful touch (combine, annotate, view detail, link) updates `lastInteractedAt` and increments `interactionCount`.
7. **A node can be a child of multiple parents.** An atom can exist in several molecules. A molecule can exist in several stories. This is intentional — the same memory fragment can be part of different meaning-structures.
8. **Minimum viable entry is a single photo.** Text is optional. The Composer treats attachments as first-class.
9. **Ukrainian-first.** All strings via `t()`. No hardcoded text in components.
10. **Mobile-first.** 375px base viewport, 480px max content width.
11. **Dark mode.** Tailwind `dark:` variants. Respect `prefers-color-scheme`.
12. **Accessible.** Keyboard navigation. Focus management. Selection state announced to screen readers.
13. **60-second re-render tick.** A `setInterval` triggers canvas re-render so decay visually progresses in real-time, even without user interaction.

## MVP scope

### In scope

- Composer (text + photo/music/video/location/link attachments)
- Auto-decomposition of entries into atoms (sentence splitting + per-attachment)
- Canvas: single unified view of all atoms/molecules/stories with decay visualization
- Selection + combine: tap to select, combine into molecule or story, optional note
- Node detail: long-press to expand, view children, add more items
- Linking: add existing atoms/molecules into an existing molecule/story
- Forgetting curve decay (blur + opacity based on time and interaction count)
- Guided onboarding (write → see atoms → combine → understand fade → start)
- Data export/import (JSON)
- Settings (name, language, export/import)
- Ukrainian + English
- Dark mode
- PWA manifest

### Out of scope (post-MVP)

- Pin-to-preserve (premium — exempt a node from decay)
- Push notifications / reminders
- Custom themes (premium)
- Full-text search across atoms
- On This Day resurfacing (same calendar date, previous years)
- Activity analytics / stats dashboard
- Tags / categories
- Any AI/LLM features

### What was removed from v2/v3

| Removed | Reason |
|---------|--------|
| Journal tab (message feed) | Replaced by the Canvas — atoms ARE the feed |
| Recall tab | Canvas IS the recall — everything in one view |
| Reflect tab | Combining IS reflecting — no separate screen |
| Fragment pool visualization | The Canvas is the pool — you see everything live |
| Weekly summary | Replaced by the canvas itself as a living dashboard |
| Message data model | Entries decompose into atoms — no monolithic messages stored |
| Reflection data model | Combining creates molecules/stories — no separate reflections |
| Fragment data model | Atoms ARE fragments — unified as nodes |
| Unlock thresholds | Removed — the canvas is always available, combining is always possible |
| Combo generation algorithm | Removed — user chooses what to combine, not the app |