import { useState } from 'react';
import { useTranslation } from '../i18n';
import useUserStore from '../store/useUserStore';
import useMessageStore from '../store/useMessageStore';
import useFragmentStore from '../store/useFragmentStore';
import useReflectionStore from '../store/useReflectionStore';
import LanguageSelector from '../components/shared/LanguageSelector';
import PoolStats from '../components/pool/PoolStats';
import { exportAllData, importData } from '../utils/exportData';
import FixedHeader from '../components/shared/FixedHeader';

export default function Settings() {
  const { t } = useTranslation();
  const name = useUserStore((s) => s.name);
  const language = useUserStore((s) => s.language);
  const setUserName = useUserStore((s) => s.setName);
  const setLanguage = useUserStore((s) => s.setLanguage);

  const messages = useMessageStore((s) => s.messages);
  const bulkImport = useMessageStore((s) => s.bulkImport);
  const fragments = useFragmentStore((s) => s.fragments);
  const reflections = useReflectionStore((s) => s.reflections);

  const [editName, setEditName] = useState(name);
  const [nameSaved, setNameSaved] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  function handleSaveName() {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FixedHeader className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {t('settings.title')}
          </h1>
        </div>
      </FixedHeader>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 max-w-lg mx-auto w-full">
        {/* Name */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            {t('settings.nameLabel')}
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={t('settings.nameLabel')}
            />
            <button
              onClick={handleSaveName}
              disabled={!editName.trim() || editName.trim() === name}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
          {nameSaved && (
            <p className="text-xs text-green-600 dark:text-green-400">✓</p>
          )}
        </section>

        {/* Language */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            {t('settings.languageLabel')}
          </h2>
          <LanguageSelector value={language} onChange={setLanguage} />
        </section>

        {/* Pool Stats */}
        <PoolStats />

        {/* Export / Import */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('settings.exportCount', { count: messages.length })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => exportAllData(messages, fragments, reflections)}
              disabled={messages.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
            >
              {t('settings.export')}
            </button>
            <label className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-center cursor-pointer">
              {t('settings.import')}
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const parsed = await importData(file);
                    const count = await bulkImport(parsed.messages);
                    setImportStatus({ ok: true, count });
                  } catch {
                    setImportStatus({ ok: false });
                  }
                  e.target.value = '';
                  setTimeout(() => setImportStatus(null), 3000);
                }}
              />
            </label>
          </div>
          {importStatus && (
            <p className={`text-xs ${importStatus.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {importStatus.ok
                ? t('settings.importSuccess', { count: importStatus.count })
                : t('settings.importError')}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
