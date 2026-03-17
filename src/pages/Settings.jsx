import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import useUserStore from '../store/useUserStore';
import useMessageStore from '../store/useMessageStore';
import LanguageSelector from '../components/shared/LanguageSelector';
import { requestPermission, scheduleReminder } from '../utils/notifications';
import { exportMessages, importMessages } from '../utils/exportData';

export default function Settings() {
  const { t } = useTranslation();
  const name = useUserStore((s) => s.name);
  const language = useUserStore((s) => s.language);
  const setUserName = useUserStore((s) => s.setName);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const preferences = useUserStore((s) => s.preferences);
  const updatePreferences = useUserStore((s) => s.updatePreferences);

  const messages = useMessageStore((s) => s.messages);
  const bulkImport = useMessageStore((s) => s.bulkImport);

  const [editName, setEditName] = useState(name);
  const [nameSaved, setNameSaved] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  function handleSaveName() {
    const trimmed = editName.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function handleToggleReminder() {
    const newEnabled = !preferences.reminderEnabled;
    if (newEnabled) {
      const result = await requestPermission();
      setPermissionStatus(result);
      if (result === 'granted') {
        scheduleReminder(preferences.reminderTime);
        updatePreferences({ reminderEnabled: true });
      }
    } else {
      updatePreferences({ reminderEnabled: false });
    }
  }

  function handleTimeChange(e) {
    const newTime = e.target.value;
    updatePreferences({ reminderTime: newTime });
    if (preferences.reminderEnabled) {
      scheduleReminder(newTime);
    }
  }

  const permissionLabel =
    permissionStatus === 'granted'
      ? t('settings.permissionGranted')
      : permissionStatus === 'denied'
      ? t('settings.permissionDenied')
      : permissionStatus === 'unsupported'
      ? t('settings.permissionUnsupported')
      : '—';

  const permissionColor =
    permissionStatus === 'granted'
      ? 'text-green-600 dark:text-green-400'
      : permissionStatus === 'denied'
      ? 'text-red-600 dark:text-red-400'
      : 'text-stone-500 dark:text-stone-400';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <header className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          {t('settings.title')}
        </h1>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
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

        {/* Reminders */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            {t('settings.reminderLabel')}
          </h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 dark:text-stone-300">
              {t('settings.reminderLabel')}
            </span>
            <button
              onClick={handleToggleReminder}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                preferences.reminderEnabled
                  ? 'bg-indigo-600'
                  : 'bg-stone-300 dark:bg-stone-600'
              }`}
              role="switch"
              aria-checked={preferences.reminderEnabled}
              aria-label={t('settings.reminderLabel')}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {preferences.reminderEnabled && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600 dark:text-stone-300">
                {t('settings.reminderTimeLabel')}
              </span>
              <input
                type="time"
                value={preferences.reminderTime}
                onChange={handleTimeChange}
                className="rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-1.5 text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={t('settings.reminderTimeLabel')}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-600 dark:text-stone-300">Status</span>
            <span className={`text-sm font-medium ${permissionColor}`}>
              {permissionLabel}
            </span>
          </div>
        </section>

        {/* Export / Import */}
        <section className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('settings.exportCount', { count: messages.length })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => exportMessages(messages)}
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
                    const parsed = await importMessages(file);
                    const count = await bulkImport(parsed);
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
