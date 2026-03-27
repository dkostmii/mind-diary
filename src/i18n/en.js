export default {
  app: { name: 'Mind Diary' },

  onboarding: {
    appDescription: "Write your thoughts \u2014 they decompose into atoms. Atoms fade over time, like real memories. By combining them into molecules, you form connections between ideas \u2014 exactly how your brain strengthens knowledge. The more you revisit and restructure, the deeper it sticks.",
    namePrompt: "What's your name?",
    writePrompt: "Write something about your day. Anything.",
    atomsExplain: "Your entry decomposed into atoms \u2014 individual thoughts, phrases, media. Each atom lives on its own.",
    atomsFadeExplain: "But atoms fade over time, like real memories. The more you write \u2014 the faster old ones fade.",
    writeMorePrompt: "Now write something else \u2014 we need more atoms to show how molecules work.",
    combinePrompt: "Select a few atoms and combine them. This will create a molecule \u2014 a connection between thoughts.",
    combineFirstPrompt: "Select a few atoms and combine them into your first molecule.",
    combineSecondPrompt: "Now combine the remaining atoms into a second molecule.",
    combineMoleculesPrompt: "Select both molecules and combine them. Molecules merge into one \u2014 flat, no nesting.",
    moleculeExplain: "A molecule is a group of atoms you linked together. Combining makes them sharp again.",
    detailPrompt: "Long-press the molecule to open its details.",
    detailExplain: "Here you can see the molecule's contents. You can add atoms or break it apart.",
    fadeExplain: "Molecules fade too. When a molecule fades enough \u2014 it falls apart into atoms. The atoms become sharp so you have time to recombine them.",
    doneMessage: "You're ready. Write, combine, build.",
    start: "Start",
  },

  canvas: {
    emptyState: "Write your first thought. It will decompose into atoms.",
    hintLongPress: "Long-press an item to open details",
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
  },

  detail: {
    addHere: "Add here",
    dissolve: "Break into atoms",
    dissolveAtom: "Dissolve",
    removeAtom: "Remove",
    created: "Created {date}",
    interactions: "{count} interactions",
  },

  levels: {
    atom: "Atom",
    molecule: "Molecule",
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
