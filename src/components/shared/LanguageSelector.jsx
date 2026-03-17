export default function LanguageSelector({ value, onChange }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onChange('uk')}
        className={`flex-1 py-3 rounded-xl text-center font-medium transition-colors ${
          value === 'uk'
            ? 'bg-indigo-600 text-white'
            : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
        }`}
      >
        Українська
      </button>
      <button
        onClick={() => onChange('en')}
        className={`flex-1 py-3 rounded-xl text-center font-medium transition-colors ${
          value === 'en'
            ? 'bg-indigo-600 text-white'
            : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
        }`}
      >
        English
      </button>
    </div>
  );
}
