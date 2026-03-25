import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { LanguageProvider, useTranslation } from "../i18n";
import useUserStore from "../store/useUserStore";
import useMessageStore from "../store/useMessageStore";
import useFragmentStore from "../store/useFragmentStore";
import useReflectionStore from "../store/useReflectionStore";
import routes from "./routes";

function NavBar() {
  const location = useLocation();
  const { t } = useTranslation();
  if (location.pathname === "/onboarding") return null;

  const links = [
    { to: "/", label: "📝", nameKey: "nav.journal" },
    { to: "/reflect", label: "💭", nameKey: "nav.reflect" },
    { to: "/recall", label: "📖", nameKey: "nav.recall" },
    { to: "/settings", label: "⚙️", nameKey: "nav.settings" },
  ];

  return (
    <nav className="shrink-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 z-50">
      <div className="max-w-md mx-auto flex justify-around py-2">
        {links.map(({ to, label, nameKey }) => {
          const active = location.pathname === to;
          const name = t(nameKey);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                active
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-stone-500 dark:text-stone-400"
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
        <Route
          path="/onboarding"
          element={routes.find((r) => r.path === "/onboarding").element}
        />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <Routes>
          {routes
            .filter((r) => r.path !== "/onboarding")
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
  const loadFragments = useFragmentStore((s) => s.loadFragments);
  const loadReflections = useReflectionStore((s) => s.loadReflections);
  const language = useUserStore((s) => s.language);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([loadMessages(), loadFragments()])
      .then(() => loadReflections())
      .then(() => setReady(true));
  }, [loadMessages, loadFragments, loadReflections]);

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
      <Analytics />
    </LanguageProvider>
  );
}
