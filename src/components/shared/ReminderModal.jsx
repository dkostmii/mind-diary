import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { requestPermission, scheduleReminder } from '../../utils/notifications';

export default function ReminderModal({ onEnable, onSkip }) {
  const { t } = useTranslation();
  const [time, setTime] = useState('21:00');

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      scheduleReminder(time);
      onEnable(time);
    } else {
      onSkip();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 text-center">
        {t('onboarding.reminderTitle')}
      </h2>

      <div className="flex justify-center">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-2.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label={t('settings.reminderTimeLabel')}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 py-3 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
        >
          {t('onboarding.reminderSkip')}
        </button>
        <button
          onClick={handleEnable}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          {t('onboarding.reminderEnable')}
        </button>
      </div>
    </div>
  );
}
