import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { LanguageProvider } from '../i18n';
import useUserStore from '../store/useUserStore';
import useNodeStore from '../store/useNodeStore';
import { migrateToNodes } from '../utils/storage';
import routes from './routes';

function AppContent() {
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);

  if (!onboardingComplete) {
    return (
      <Routes>
        <Route
          path="/onboarding"
          element={routes.find((r) => r.path === '/onboarding').element}
        />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <Routes>
        {routes
          .filter((r) => r.path !== '/onboarding')
          .map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function makeAtom(word) {
  return { id: `${word}-${Date.now()}`, level: 'atom', type: 'text', content: { excerpt: word }, childIds: [] };
}

// Animation cycle:
// 1. [Mind, Diary] both sharp
// 2. Diary fades out → removed
// 3. New Diary appears on top (sharp), pushing Mind down → [Diary, Mind]
// 4. Mind fades out → removed
// 5. New Mind appears on top (sharp), pushing Diary down → [Mind, Diary]
// Repeat from 2

const FADE_MS = 800;
const PAUSE_MS = 400;

function AtomLoader() {
  const [atoms, setAtoms] = useState(() => [makeAtom('Mind'), makeAtom('Diary')]);
  const [fadingId, setFadingId] = useState(null);
  const [step, setStep] = useState(0); // 0=pause, 1=fade-bottom, 2=add-top

  const bottomWord = atoms.length > 1 ? atoms[1].content.excerpt : atoms[0].content.excerpt;

  const tick = useCallback(() => {
    if (step === 0) {
      // Start fading the bottom atom
      setFadingId(atoms[atoms.length - 1].id);
      setStep(1);
    } else if (step === 1) {
      // Remove faded atom, add new one on top
      const word = atoms[atoms.length - 1].content.excerpt;
      setAtoms(prev => [makeAtom(word), ...prev.slice(0, -1)]);
      setFadingId(null);
      setStep(2);
    } else {
      // Pause before next cycle
      setStep(0);
    }
  }, [step, atoms]);

  useEffect(() => {
    const delay = step === 1 ? FADE_MS : PAUSE_MS;
    const timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [step, tick]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-900">
      <div className="flex flex-col items-start gap-2">
        {atoms.map(atom => (
          <div
            key={atom.id}
            className={`inline-block rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm px-3 py-2`}
            style={{
              opacity: fadingId === atom.id ? 0.12 : 1,
              filter: fadingId === atom.id ? 'blur(6px)' : 'none',
              transition: `opacity ${FADE_MS}ms ease, filter ${FADE_MS}ms ease`,
            }}
          >
            <span className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
              {atom.content.excerpt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const loadNodes = useNodeStore((s) => s.loadNodes);
  const language = useUserStore((s) => s.language);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const minDelay = new Promise(r => setTimeout(r, 2000));
    Promise.all([
      migrateToNodes().then(() => loadNodes()),
      minDelay,
    ]).then(() => setReady(true));
  }, [loadNodes]);

  if (!ready) {
    return <AtomLoader />;
  }

  return (
    <LanguageProvider language={language}>
      <HashRouter>
        <AppContent />
      </HashRouter>
      <Analytics />
    </LanguageProvider>
  );
}
