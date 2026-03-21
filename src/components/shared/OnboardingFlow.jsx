import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';
import LanguageSelector from './LanguageSelector';
import useUserStore from '../../store/useUserStore';

const STEPS = {
  LANGUAGE: 0,
  NAME: 1,
};

export default function OnboardingFlow({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(STEPS.LANGUAGE);
  const [name, setName] = useState('');
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const setUserName = useUserStore((s) => s.setName);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (step === STEPS.NAME && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [step]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    completeOnboarding();
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {step === STEPS.LANGUAGE && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-200 text-center">
              Mind Diary
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
              {t('onboarding.appDescription')}
            </p>
            <LanguageSelector value={language} onChange={setLanguage} />
            <button
              onClick={() => setStep(STEPS.NAME)}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              {t('common.done')}
            </button>
          </div>
        )}

        {step === STEPS.NAME && (
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <label className="block text-lg font-medium text-stone-700 dark:text-stone-300 text-center">
              {t('onboarding.namePrompt')}
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3 text-stone-800 dark:text-stone-200 text-center text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoComplete="given-name"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              {t('common.done')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
