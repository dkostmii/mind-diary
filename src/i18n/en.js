export default {
  app: { name: 'Mind Diary' },

  onboarding: {
    namePrompt: "What's your name?",
    writePrompt: "Write something about your day. Anything.",
    atomsExplain: "Your entry decomposed into atoms \u2014 individual thoughts, phrases, media. Each atom lives on its own.",
    combinePrompt: "Select a few atoms and combine them. This will create a molecule \u2014 a connection between thoughts.",
    combineFirstPrompt: "Select a few atoms and combine them into your first molecule.",
    combineSecondPrompt: "Now combine the remaining atoms into a second molecule.",
    combineMoleculesPrompt: "Select both molecules and combine them. Molecules merge into one \u2014 flat, no nesting.",
    moleculeExplain: "A molecule is a group of atoms you linked together. Each combination refreshes them, keeping them from fading.",
    fadeExplain: "Atoms fade over time, like real memories. Combining and interacting keeps them bright. What matters \u2014 you'll keep. The rest will fade.",
    doneMessage: "You're ready. Write, combine, build.",
    start: "Start",
  },

  canvas: {
    emptyState: "Write your first thought. It will decompose into atoms.",
  },

  composer: {
    placeholder: "Write something...",
    send: "Send",
  },

  combine: {
    title: "Combine",
    notePlaceholder: "Add a note...",
    confirm: "Combine",
    cancel: "Cancel",
    selected: "{count} selected",
    resultMolecule: "New molecule",
    resultStory: "New story",
  },

  detail: {
    addHere: "Add here",
    created: "Created {date}",
    interactions: "{count} interactions",
  },

  levels: {
    atom: "Atom",
    molecule: "Molecule",
    story: "Story",
  },

  settings: {
    title: "Settings",
    name: "Name",
    language: "Language",
    exportJSON: "Export data",
    importJSON: "Import data",
    nodeCount: "{count} nodes",
    resetOnboarding: "Redo onboarding",
  },

  common: {
    save: "Save",
    cancel: "Cancel",
    done: "Done",
    back: "Back",
    close: "Close",
    delete: "Delete",
    attachPhoto: "Add photo",
    maxPhotos: "10 photos max",
    maxPhotosReached: "Max photos",
    attachLocation: "Add location",
    somePlace: "Some place",
    useMyLocation: "My location",
    searchPlace: "Search for a place...",
    confirmLocation: "Confirm",
    viewMedia: "View media",
    confirmDelete: "Are you sure?",
    deleteConfirmMessage: "This action cannot be undone.",
  },
};
