export function exportMessages(messages) {
  const data = JSON.stringify(messages, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mind-diary-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importMessages(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) {
          reject(new Error('Invalid format'));
          return;
        }
        const valid = data.filter(
          (m) =>
            m &&
            typeof m.id === 'string' &&
            typeof m.text === 'string' &&
            typeof m.createdAt === 'number' &&
            typeof m.date === 'string'
        );
        resolve(valid);
      } catch {
        reject(new Error('Invalid JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Read error'));
    reader.readAsText(file);
  });
}
