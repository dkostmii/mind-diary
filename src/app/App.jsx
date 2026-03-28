import { useEffect, useState } from 'react';
import { LanguageProvider } from '../i18n';
import useChatStore from '../store/useChatStore';
import Main from '../pages/Main';

export default function App() {
  const loadMessages = useChatStore((s) => s.loadMessages);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadMessages().then(() => setReady(true));
  }, [loadMessages]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-stone-900">
        <div className="text-stone-400 dark:text-stone-500 text-sm animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider language="en">
      <Main />
    </LanguageProvider>
  );
}
