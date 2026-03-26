export function exportAsJSON(nodes) {
  const data = JSON.stringify(nodes, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mind-diary-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target.result);

        // New format: array of nodes
        if (Array.isArray(raw)) {
          const valid = raw.filter(
            (n) =>
              n &&
              typeof n.id === 'string' &&
              typeof n.level === 'string' &&
              typeof n.createdAt === 'number'
          );
          resolve(valid);
          return;
        }

        // Old format: { messages, fragments, reflections }
        // Convert fragments to atoms, reflections to molecules
        if (raw.fragments || raw.messages || raw.reflections) {
          const nodes = [];
          const fragments = raw.fragments || [];
          const reflections = raw.reflections || [];

          for (const frag of fragments) {
            if (!frag || !frag.id) continue;
            nodes.push({
              id: frag.id,
              level: 'atom',
              type: frag.type || 'text',
              content: frag.content || {},
              childIds: [],
              note: null,
              createdAt: frag.createdAt || Date.now(),
              lastInteractedAt: frag.createdAt || Date.now(),
              interactionCount: 1,
            });
          }

          for (const ref of reflections) {
            if (!ref || !ref.id) continue;
            nodes.push({
              id: ref.id,
              level: 'molecule',
              type: null,
              content: null,
              childIds: ref.fragmentIds || [],
              note: ref.text || null,
              createdAt: ref.createdAt || Date.now(),
              lastInteractedAt: ref.createdAt || Date.now(),
              interactionCount: 1,
            });
          }

          resolve(nodes);
          return;
        }

        reject(new Error('Unrecognized format'));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Read error'));
    reader.readAsText(file);
  });
}
