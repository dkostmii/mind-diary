export function exportAllData(messages, fragments, reflections) {
  const data = JSON.stringify({ messages, fragments, reflections }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mind-diary-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Legacy: export messages only
export function exportMessages(messages) {
  exportAllData(messages, [], []);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target.result);

        // Support both old format (array of messages) and new format ({ messages, fragments, reflections })
        if (Array.isArray(raw)) {
          const valid = raw.filter(
            (m) =>
              m &&
              typeof m.id === 'string' &&
              typeof m.createdAt === 'number' &&
              typeof m.date === 'string'
          );
          resolve({ messages: valid, fragments: [], reflections: [] });
          return;
        }

        const messages = (raw.messages || []).filter(
          (m) => m && typeof m.id === 'string' && typeof m.createdAt === 'number' && typeof m.date === 'string'
        );
        const fragments = (raw.fragments || []).filter(
          (f) => f && typeof f.id === 'string' && typeof f.type === 'string' && typeof f.createdAt === 'number'
        );
        const reflections = (raw.reflections || []).filter(
          (r) => r && typeof r.id === 'string' && Array.isArray(r.fragmentIds) && typeof r.createdAt === 'number'
        );

        resolve({ messages, fragments, reflections });
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Read error'));
    reader.readAsText(file);
  });
}

// Legacy alias
export function importMessages(file) {
  return importData(file).then((d) => d.messages);
}
