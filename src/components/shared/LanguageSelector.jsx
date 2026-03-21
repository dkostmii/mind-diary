const languages = [
  { code: 'uk', label: 'Українська' },
  { code: 'en', label: 'English' },
];

export default function LanguageSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      {languages.map(({ code, label }) => {
        const selected = value === code;
        return (
          <label
            key={code}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
              selected
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-600 dark:border-indigo-400'
                : 'bg-stone-100 dark:bg-stone-700 border-2 border-transparent hover:bg-stone-200 dark:hover:bg-stone-600'
            }`}
          >
            <input
              type="radio"
              name="language"
              value={code}
              checked={selected}
              onChange={() => onChange(code)}
              className="sr-only"
            />
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selected
                  ? 'border-indigo-600 dark:border-indigo-400'
                  : 'border-stone-400 dark:border-stone-500'
              }`}
            >
              {selected && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </span>
            <span
              className={`font-medium ${
                selected
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : 'text-stone-700 dark:text-stone-300'
              }`}
            >
              {label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
