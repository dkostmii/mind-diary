import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n';
import useUserStore from '../store/useUserStore';
import useNodeStore from '../store/useNodeStore';
import LanguageSelector from '../components/shared/LanguageSelector';
import { getStats } from '../engine/stats';
import { exportAsJSON, importData } from '../utils/exportData';

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const name = useUserStore((s) => s.name);
  const language = useUserStore((s) => s.language);
  const setUserName = useUserStore((s) => s.setName);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const resetOnboarding = useUserStore((s) => s.resetOnboarding);

  const nodes = useNodeStore((s) => s.nodes);
  const importNodes = useNodeStore((s) => s.importNodes);

  const stats = getStats(nodes);

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
      <header className="shrink-0 px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          {t('settings.title')}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-6 max-w-lg mx-auto w-full">
        {/* Name */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            {t('settings.name')}
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={t('settings.name')}
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
            {t('settings.language')}
          </h2>
          <LanguageSelector value={language} onChange={setLanguage} />
        </section>

        {/* Node counts */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            {t('settings.nodeCount', { count: nodes.length })}
          </h2>
          <div className="flex gap-4 text-xs text-stone-500 dark:text-stone-400">
            <span>{t('levels.atom')}: {stats.totalAtoms}</span>
            <span>{t('levels.molecule')}: {stats.totalMolecules}</span>
          </div>
        </section>

        {/* Export / Import */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => exportAsJSON(nodes)}
              disabled={nodes.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
            >
              {t('settings.exportJSON')}
            </button>
            <label className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors text-center cursor-pointer">
              {t('settings.importJSON')}
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const parsed = await importData(file);
                    const count = await importNodes(parsed);
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
                ? `${importStatus.count} nodes imported`
                : 'Import failed'}
            </p>
          )}
        </section>

        {/* Reset onboarding */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => {
              resetOnboarding();
              navigate('/onboarding');
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            {t('settings.resetOnboarding')}
          </button>
        </section>
      </div>
    </div>
  );
}
