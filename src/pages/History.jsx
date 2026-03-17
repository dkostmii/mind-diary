import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import useMessageStore from '../store/useMessageStore';
import FilterBar from '../components/history/FilterBar';
import HistoryFeed from '../components/history/HistoryFeed';

export default function History() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const messages = useMessageStore((s) => s.messages);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const editMessage = useMessageStore((s) => s.editMessage);
  const removeReflection = useMessageStore((s) => s.removeReflection);
  const editReflection = useMessageStore((s) => s.editReflection);
  const [filter, setFilter] = useState('all');

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
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          {t('history.title')}
        </h1>
      </header>

      <FilterBar active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-stone-400 dark:text-stone-500 text-center text-lg">
            {t('journal.emptyState')}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <HistoryFeed
            messages={filtered}
            onReflect={handleReflect}
            onDeleteMessage={removeMessage}
            onEditMessage={editMessage}
            onDeleteReflection={removeReflection}
            onEditReflection={editReflection}
          />
        </div>
      )}
    </div>
  );
}
