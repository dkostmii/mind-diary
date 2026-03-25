import { useState, useMemo } from 'react';
import { useTranslation } from '../i18n';
import useFragmentStore from '../store/useFragmentStore';
import useReflectionStore from '../store/useReflectionStore';
import RecallFeed from '../components/recall/RecallFeed';
import HelpModal from '../components/shared/HelpModal';
import FixedHeader from '../components/shared/FixedHeader';

export default function Recall() {
  const { t } = useTranslation();
  const fragments = useFragmentStore((s) => s.fragments);
  const reflections = useReflectionStore((s) => s.reflections);
  const removeReflection = useReflectionStore((s) => s.removeReflection);
  const [helpOpen, setHelpOpen] = useState(false);

  const fragmentsById = useMemo(
    () => new Map(fragments.map((f) => [f.id, f])),
    [fragments]
  );

  const sorted = useMemo(
    () => [...reflections].sort((a, b) => b.createdAt - a.createdAt),
    [reflections]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FixedHeader className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📖</span>
          <div>
            <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
              {t('recall.title')}
            </h1>
            <p className="text-sm text-stone-400 dark:text-stone-500">{t('recall.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setHelpOpen(true)}
          className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-semibold"
          aria-label={t('help.title')}
        >
          ?
        </button>
      </FixedHeader>

      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <p className="text-stone-400 dark:text-stone-500 text-center text-lg">
            {t('recall.emptyState')}
          </p>
        </div>
      ) : (
        <RecallFeed
          reflections={sorted}
          fragmentsById={fragmentsById}
          onDelete={removeReflection}
        />
      )}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
