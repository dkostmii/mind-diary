import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
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

export default function App() {
  const loadNodes = useNodeStore((s) => s.loadNodes);
  const language = useUserStore((s) => s.language);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    migrateToNodes()
      .then(() => loadNodes())
      .then(() => setReady(true));
  }, [loadNodes]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-4xl animate-pulse">Mind Diary</span>
      </div>
    );
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
