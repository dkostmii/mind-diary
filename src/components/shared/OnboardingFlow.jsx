import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import LanguageSelector from './LanguageSelector';
import useUserStore from '../../store/useUserStore';
import useMessageStore from '../../store/useMessageStore';
import useFragmentStore from '../../store/useFragmentStore';
import useReflectionStore from '../../store/useReflectionStore';
import FragmentCard from '../reflect/FragmentCard';
import Composer from './Composer';

const STEPS = {
  LANGUAGE: 0,
  NAME: 1,
  BLUR_PHILOSOPHY: 2,
  FIRST_ENTRY: 3,
  FRAGMENTS: 4,
  REFLECT: 5,
};

// Centered card layout for simple steps (language, name, blur)
function CenteredStep({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {children}
      </div>
    </div>
  );
}

// Full-height layout for steps with Composer (first entry, reflect)
function FullHeightStep({ header, children, composer }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center space-y-2">
          {header}
        </div>
        {children && (
          <div className="shrink-0 px-4 pb-4">
            {children}
          </div>
        )}
      </div>
      {composer}
    </div>
  );
}

export default function OnboardingFlow({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(STEPS.LANGUAGE);
  const [name, setName] = useState('');
  const [onboardingFragments, setOnboardingFragments] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const setUserName = useUserStore((s) => s.setName);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const addMessage = useMessageStore((s) => s.addMessage);
  const addReflection = useReflectionStore((s) => s.addReflection);
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
    setStep(STEPS.BLUR_PHILOSOPHY);
  };

  const handleFirstEntry = async (text, images, location) => {
    await addMessage(text, images, location);
    const frags = useFragmentStore.getState().fragments;
    setOnboardingFragments(frags);
    setStep(STEPS.FRAGMENTS);
  };

  const handleToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReflect = async (text, images, location) => {
    if (selectedIds.size > 0) {
      await addReflection([...selectedIds], text, images, location);
    }
    handleFinish();
  };

  const handleFinish = () => {
    completeOnboarding();
    onComplete();
  };

  if (step === STEPS.LANGUAGE) {
    return (
      <CenteredStep>
        <img src="/open-book-noto-512.png" alt="Mind Diary" className="w-20 h-20 mx-auto" />
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
      </CenteredStep>
    );
  }

  if (step === STEPS.NAME) {
    return (
      <CenteredStep>
        <form onSubmit={handleNameSubmit} className="space-y-6">
          <div className="text-5xl text-center">😊👋</div>
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
      </CenteredStep>
    );
  }

  if (step === STEPS.BLUR_PHILOSOPHY) {
    return (
      <CenteredStep>
        <div className="text-5xl text-center">🌫️</div>
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 text-center">
          {t('onboarding.blurTitle')}
        </h2>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-center">
          {t('onboarding.blurDescription')}
        </p>
        <button
          onClick={() => setStep(STEPS.FIRST_ENTRY)}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          {t('onboarding.blurContinue')}
        </button>
      </CenteredStep>
    );
  }

  if (step === STEPS.FIRST_ENTRY) {
    return (
      <FullHeightStep
        header={
          <>
            <div className="text-5xl">📝</div>
            <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
              {t('onboarding.firstEntryTitle')}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('onboarding.firstEntryHint')}
            </p>
          </>
        }
        composer={
          <Composer
            placeholder={t('journal.placeholder')}
            buttonLabel={t('journal.send')}
            buttonIcon={Send}
            onSubmit={handleFirstEntry}
          />
        }
      />
    );
  }

  if (step === STEPS.FRAGMENTS) {
    return (
      <CenteredStep>
        <div className="text-5xl text-center">✨</div>
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 text-center">
          {t('onboarding.fragmentsTitle')}
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center">
          {t('onboarding.fragmentsDescription')}
        </p>
        <div className="space-y-2">
          {onboardingFragments.map((f) => (
            <FragmentCard key={f.id} fragment={f} />
          ))}
        </div>
        {onboardingFragments.length >= 2 ? (
          <button
            onClick={() => setStep(STEPS.REFLECT)}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            {t('onboarding.fragmentsContinue')}
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
          >
            {t('common.done')}
          </button>
        )}
      </CenteredStep>
    );
  }

  if (step === STEPS.REFLECT) {
    return (
      <FullHeightStep
        header={
          <>
            <div className="text-5xl">💭</div>
            <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
              {t('onboarding.reflectTitle')}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t('onboarding.reflectDescription')}
            </p>
          </>
        }
        composer={
          <Composer
            placeholder={t('reflect.composePlaceholder')}
            buttonLabel={t('reflect.save')}
            buttonIcon={MessageCircle}
            onSubmit={handleReflect}
            allowEmpty
            disabled={selectedIds.size === 0}
          />
        }
      >
        <div className="space-y-2 max-w-sm mx-auto">
          {onboardingFragments.map((f) => (
            <FragmentCard
              key={f.id}
              fragment={f}
              selected={selectedIds.has(f.id)}
              onClick={() => handleToggle(f.id)}
            />
          ))}
        </div>
        {selectedIds.size > 0 && (
          <p className="text-xs font-medium text-indigo-500 dark:text-indigo-400 text-center mt-3">
            {t('reflect.selected', { count: selectedIds.size })}
          </p>
        )}
      </FullHeightStep>
    );
  }

  return null;
}
