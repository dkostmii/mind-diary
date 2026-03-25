import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import useMessageStore from '../store/useMessageStore';
import useFragmentStore from '../store/useFragmentStore';
import useUserStore from '../store/useUserStore';
import { getPoolStats, getUnlockedFeatures, UNLOCK_THRESHOLDS } from '../engine/poolStats';
import MessageFeed from '../components/journal/MessageFeed';
import ComposeBar from '../components/journal/ComposeBar';
import PoolBar from '../components/pool/PoolBar';
import UnlockToast from '../components/pool/UnlockToast';
import HelpModal from '../components/shared/HelpModal';
import FixedHeader from '../components/shared/FixedHeader';

export default function Journal() {
  const { t } = useTranslation();
  const messages = useMessageStore((s) => s.messages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const editMessage = useMessageStore((s) => s.editMessage);
  const fragments = useFragmentStore((s) => s.fragments);
  const name = useUserStore((s) => s.name);
  const [helpOpen, setHelpOpen] = useState(false);
  const [unlockToast, setUnlockToast] = useState(null);
  const prevUnlockedRef = useRef(null);

  // Track unlock threshold changes
  useEffect(() => {
    const stats = getPoolStats(fragments);
    const unlocked = getUnlockedFeatures(stats);
    const prev = prevUnlockedRef.current;
    if (prev !== null) {
      const newKeys = unlocked.filter((k) => !prev.includes(k));
      if (newKeys.length > 0) {
        const found = UNLOCK_THRESHOLDS.find((th) => th.key === newKeys[0]);
        if (found) setUnlockToast(found.label);
      }
    }
    prevUnlockedRef.current = unlocked;
  }, [fragments]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FixedHeader className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <div>
            <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
              {t('onboarding.welcome', { name })}
            </h1>
            <p className="text-sm text-stone-400 dark:text-stone-500">{t('journal.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PoolBar />
          <button
            onClick={() => setHelpOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-semibold"
            aria-label={t('help.title')}
          >
            ?
          </button>
        </div>
      </FixedHeader>

      <MessageFeed messages={messages} onDelete={removeMessage} onEdit={editMessage} />
      <ComposeBar onSend={addMessage} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {unlockToast && (
        <UnlockToast
          messageKey={unlockToast}
          onDone={() => setUnlockToast(null)}
        />
      )}
    </div>
  );
}
