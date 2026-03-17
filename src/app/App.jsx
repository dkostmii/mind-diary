import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LanguageProvider } from '../i18n';
import useUserStore from '../store/useUserStore';
import useMessageStore from '../store/useMessageStore';
import routes from './routes';

function NavBar() {
  const location = useLocation();
  if (location.pathname === '/onboarding') return null;

  const links = [
    { to: '/', label: '📝', name: 'Journal' },
    { to: '/reflect', label: '💭', name: 'Reflect' },
    { to: '/history', label: '📖', name: 'History' },
    { to: '/settings', label: '⚙️', name: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {links.map(({ to, label, name }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                active
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
              aria-label={name}
            >
              <span className="text-lg">{label}</span>
              <span>{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AppContent() {
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);

  if (!onboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding" element={routes.find((r) => r.path === '/onboarding').element} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="pb-16 h-[calc(100dvh-4rem)] flex flex-col">
        <Routes>
          {routes
            .filter((r) => r.path !== '/onboarding')
            .map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <NavBar />
    </>
  );
}

export default function App() {
  const loadMessages = useMessageStore((s) => s.loadMessages);
  const language = useUserStore((s) => s.language);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadMessages().then(() => setReady(true));
  }, [loadMessages]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-4xl animate-pulse">📝</span>
      </div>
    );
  }

  return (
    <LanguageProvider language={language}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </LanguageProvider>
  );
}
