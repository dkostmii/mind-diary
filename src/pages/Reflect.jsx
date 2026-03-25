import { useState, useMemo } from 'react';
import { useTranslation } from '../i18n';
import useFragmentStore from '../store/useFragmentStore';
import useReflectionStore from '../store/useReflectionStore';
import { getPoolStats } from '../engine/poolStats';
import { getDecayLevel } from '../engine/decayCalculator';
import FragmentCollage from '../components/reflect/FragmentCollage';
import ReflectCompose from '../components/reflect/ReflectCompose';
import HelpModal from '../components/shared/HelpModal';
import FixedHeader from '../components/shared/FixedHeader';

const MIN_FRAGMENTS = 10;

export default function Reflect() {
  const { t } = useTranslation();
  const fragments = useFragmentStore((s) => s.fragments);
  const reflections = useReflectionStore((s) => s.reflections);
  const addReflection = useReflectionStore((s) => s.addReflection);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [helpOpen, setHelpOpen] = useState(false);

  const usedFragmentIds = useMemo(
    () => new Set(
      reflections
        .filter((r) => getDecayLevel(r.createdAt).blur === 0)
        .flatMap((r) => r.fragmentIds)
    ),
    [reflections]
  );
  const availableFragments = useMemo(
    () => fragments.filter((f) => !usedFragmentIds.has(f.id)),
    [fragments, usedFragmentIds]
  );

  const stats = getPoolStats(availableFragments);
  const canReflect = stats.total >= MIN_FRAGMENTS;

  const handleToggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async (text, images, location) => {
    if (selectedIds.size === 0) return;
    await addReflection([...selectedIds], text, images, location);
    setSelectedIds(new Set());
  };

  const headerContent = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-2xl">💭</span>
        <div>
          <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {t('reflect.title')}
          </h1>
          <p className="text-sm text-stone-400 dark:text-stone-500">{t('reflect.subtitle')}</p>
        </div>
      </div>
      <button
        onClick={() => setHelpOpen(true)}
        className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-semibold"
        aria-label={t('help.title')}
      >
        ?
      </button>
    </>
  );

  if (!canReflect) {
    const needed = MIN_FRAGMENTS - availableFragments.length;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <FixedHeader className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
          {headerContent}
        </FixedHeader>
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 min-h-0">
          <span className="text-5xl">🌱</span>
          <p className="text-stone-700 dark:text-stone-300 text-center font-medium">
            {t('reflect.poolNeeded')}
          </p>
          <p className="text-stone-400 dark:text-stone-500 text-center text-sm">
            {t('reflect.poolNeededHint', { needed })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 rounded-full bg-stone-200 dark:bg-stone-700 w-32 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(100, (availableFragments.length / MIN_FRAGMENTS) * 100)}%` }}
              />
            </div>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {availableFragments.length}/{MIN_FRAGMENTS}
            </span>
          </div>
        </div>
        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FixedHeader className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
        {headerContent}
      </FixedHeader>

      <div className="flex-1 overflow-y-auto min-h-0">
        {selectedIds.size > 0 && (
          <p className="px-4 pt-3 pb-1 text-xs font-medium text-indigo-500 dark:text-indigo-400">
            {t('reflect.selected', { count: selectedIds.size })}
          </p>
        )}
        <FragmentCollage
          fragments={availableFragments}
          selectedIds={selectedIds}
          onToggle={handleToggle}
        />
      </div>

      <ReflectCompose onSave={handleSave} disabled={selectedIds.size === 0} />

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
