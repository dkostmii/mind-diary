import { useState } from 'react';
import { useTranslation } from '../../i18n';
import useUserStore from '../../store/useUserStore';
import useNodeStore from '../../store/useNodeStore';
import LanguageSelector from '../shared/LanguageSelector';
import StepWrite from './StepWrite';
import StepAtoms from './StepAtoms';
import StepCombine from './StepCombine';
import StepDetail from './StepDetail';
import StepFade from './StepFade';
import StepDone from './StepDone';

const STEPS = {
  LANGUAGE: 0,
  NAME: 1,
  WRITE: 2,
  ATOMS: 3,
  WRITE_MORE: 4,
  ATOMS_MORE: 5,
  COMBINE_A: 6,
  DETAIL_A: 7,
  COMBINE_B: 8,
  COMBINE_MOLECULES: 9,
  FADE: 10,
  DONE: 11,
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
  const [moleculeAId, setMoleculeAId] = useState(null);
  const [moleculeBId, setMoleculeBId] = useState(null);
  const [finalMoleculeId, setFinalMoleculeId] = useState(null);

  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);
  const setUserName = useUserStore((s) => s.setName);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const nodes = useNodeStore((s) => s.nodes);

  const next = () => setStep(s => s + 1);

  // Step 0: Language
  if (step === STEPS.LANGUAGE) {
    return (
      <CenteredStep>
        <div className="flex flex-col items-center gap-3">
          <img
            src="/open-book-noto-192.png"
            alt="Mind Diary"
            className="w-20 h-20"
          />
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-200">
            Mind Diary
          </h1>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center leading-relaxed">
          {t('onboarding.appDescription')}
        </p>
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
        <p className="text-4xl text-center">😊👋</p>
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

  // Step 3: See atoms (+ fade demo)
  if (step === STEPS.ATOMS) {
    return <StepAtoms atoms={atoms} onContinue={() => {
      if (atoms.length >= 2) {
        // Enough atoms, skip to combine
        setStep(STEPS.COMBINE_A);
      } else {
        // Single atom: fade demo done, now ask for more
        next(); // → WRITE_MORE
      }
    }} />;
  }

  // Step 4: Write more (after seeing the single atom fade)
  if (step === STEPS.WRITE_MORE) {
    return <StepWrite
      promptKey="onboarding.writeMorePrompt"
      onComplete={(newAtoms) => {
        setAtoms(prev => [...prev, ...newAtoms]);
        next(); // → ATOMS_MORE
      }}
    />;
  }

  // Step 5: See all atoms (after writing more — skip fade demo, already seen it)
  if (step === STEPS.ATOMS_MORE) {
    return <StepAtoms atoms={atoms} skipFadeDemo onContinue={() => {
      if (atoms.length >= 2) {
        setStep(STEPS.COMBINE_A);
      } else {
        // Still not enough — send back to write more
        setStep(STEPS.WRITE_MORE);
      }
    }} />;
  }

  // Step 6: Combine first batch of atoms → molecule A
  if (step === STEPS.COMBINE_A) {
    const canDoFull = atoms.length >= 4;
    return (
      <StepCombine
        items={atoms}
        prompt={canDoFull ? t('onboarding.combineFirstPrompt') : t('onboarding.combinePrompt')}
        onComplete={(id) => {
          setMoleculeAId(id);
          next(); // always go to DETAIL_A
        }}
      />
    );
  }

  // Step 5: Long-press molecule A to see details
  if (step === STEPS.DETAIL_A) {
    const canDoFull = atoms.length >= 4;
    return (
      <StepDetail
        moleculeId={moleculeAId}
        onComplete={() => {
          if (canDoFull) {
            next();
          } else {
            setFinalMoleculeId(moleculeAId);
            setStep(STEPS.FADE);
          }
        }}
      />
    );
  }

  // Step 6: Combine remaining atoms → molecule B
  if (step === STEPS.COMBINE_B) {
    const moleculeA = nodes.find(n => n.id === moleculeAId);
    const usedIds = new Set(moleculeA?.childIds || []);
    const remaining = atoms.filter(a => !usedIds.has(a.id));

    if (remaining.length < 2) {
      // Not enough remaining atoms; skip to combining molecules with what we have
      setStep(STEPS.COMBINE_MOLECULES);
      return null;
    }

    return (
      <StepCombine
        items={remaining}
        prompt={t('onboarding.combineSecondPrompt')}
        onComplete={(id) => {
          setMoleculeBId(id);
          next();
        }}
      />
    );
  }

  // Step 6: Combine molecule A + molecule B → final molecule
  if (step === STEPS.COMBINE_MOLECULES) {
    const moleculesForMerge = [moleculeAId, moleculeBId]
      .filter(Boolean)
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean);

    if (moleculesForMerge.length < 2) {
      // Only one molecule available, use it as the final
      setFinalMoleculeId(moleculeAId);
      setStep(STEPS.FADE);
      return null;
    }

    return (
      <StepCombine
        items={moleculesForMerge}
        prompt={t('onboarding.combineMoleculesPrompt')}
        onComplete={(id) => {
          setFinalMoleculeId(id);
          next();
        }}
      />
    );
  }

  // Step 7: Fade demo
  if (step === STEPS.FADE) {
    return <StepFade atoms={atoms} moleculeId={finalMoleculeId || moleculeAId} onContinue={next} />;
  }

  // Step 8: Done
  return (
    <StepDone onStart={() => {
      completeOnboarding();
      onComplete();
    }} />
  );
}
