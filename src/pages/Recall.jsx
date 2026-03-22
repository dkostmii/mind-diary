import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import useMessageStore from '../store/useMessageStore';
import useUserStore from '../store/useUserStore';
import FilterBar from '../components/recall/FilterBar';
import RecallFeed from '../components/recall/RecallFeed';
import HelpModal from '../components/shared/HelpModal';
import FixedHeader from '../components/shared/FixedHeader';

export default function Recall() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const messages = useMessageStore((s) => s.messages);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const editMessage = useMessageStore((s) => s.editMessage);
  const removeReflection = useMessageStore((s) => s.removeReflection);
  const editReflection = useMessageStore((s) => s.editReflection);
  const name = useUserStore((s) => s.name);
  const [filter, setFilter] = useState('all');
  const [helpOpen, setHelpOpen] = useState(false);

  const sorted = [...messages].sort((a, b) => b.createdAt - a.createdAt);

  const filtered = sorted.filter((m) => {
    if (filter === 'reflected') return m.reflection !== null;
    if (filter === 'unreflected') return m.reflection === null;
    return true;
  });

  const handleReflect = (id) => {
    navigate(`/reflect?id=${id}`);
  };

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

      <FilterBar active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <p className="text-stone-400 dark:text-stone-500 text-center text-lg">
            {t('recall.emptyState')}
          </p>
        </div>
      ) : (
        <RecallFeed
            messages={filtered}
            userName={name}
            onReflect={handleReflect}
            onDeleteMessage={removeMessage}
            onEditMessage={editMessage}
            onDeleteReflection={removeReflection}
            onEditReflection={editReflection}
          />
      )}
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
