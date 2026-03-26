import { useState } from 'react';
import { useTranslation } from '../../i18n';
import useUserStore from '../../store/useUserStore';
import LanguageSelector from '../shared/LanguageSelector';
import StepWrite from './StepWrite';
import StepAtoms from './StepAtoms';
import StepCombine from './StepCombine';
import StepFade from './StepFade';
import StepDone from './StepDone';

const STEPS = {
  LANGUAGE: 0,
  NAME: 1,
  WRITE: 2,
  ATOMS: 3,
  COMBINE: 4,
  FADE: 5,
  DONE: 6,
};

function CenteredStep({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {children}
      </div>
    </div>
  );
}

export default function OnboardingFlow({ onComplete }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(STEPS.LANGUAGE);
  const [name, setName] = useState('');
  const [atoms, setAtoms] = useState([]);
  const [moleculeId, setMoleculeId] = useState(null);

  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const setUserName = useUserStore((s) => s.setName);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const next = () => setStep(s => s + 1);

  // Step 0: Language
  if (step === STEPS.LANGUAGE) {
    return (
      <CenteredStep>
        <h1 className="text-2xl font-bold text-center text-stone-800 dark:text-stone-200">
          Mind Diary
        </h1>
        <LanguageSelector value={language} onChange={setLanguage} />
        <button
          onClick={next}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          {t('common.done')}
        </button>
      </CenteredStep>
    );
  }

  // Step 1: Name
  if (step === STEPS.NAME) {
    return (
      <CenteredStep>
        <h2 className="text-xl font-semibold text-center text-stone-800 dark:text-stone-200">
          {t('onboarding.namePrompt')}
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 px-4 py-3 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              setUserName(name.trim());
              next();
            }
          }}
        />
        <button
          onClick={() => { setUserName(name.trim()); next(); }}
          disabled={!name.trim()}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
        >
          {t('common.done')}
        </button>
      </CenteredStep>
    );
  }

  // Step 2: Write
  if (step === STEPS.WRITE) {
    return <StepWrite onComplete={(newAtoms) => { setAtoms(newAtoms); next(); }} />;
  }

  // Step 3: See atoms
  if (step === STEPS.ATOMS) {
    return <StepAtoms atoms={atoms} onContinue={next} />;
  }

  // Step 4: Combine
  if (step === STEPS.COMBINE) {
    return <StepCombine atoms={atoms} onComplete={(id) => { setMoleculeId(id); next(); }} />;
  }

  // Step 5: Fade demo
  if (step === STEPS.FADE) {
    return <StepFade atoms={atoms} moleculeId={moleculeId} onContinue={next} />;
  }

  // Step 6: Done
  return (
    <StepDone onStart={() => {
      completeOnboarding();
      onComplete();
    }} />
  );
}
