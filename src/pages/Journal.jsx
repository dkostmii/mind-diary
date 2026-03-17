import { useTranslation } from '../i18n';
import useMessageStore from '../store/useMessageStore';
import useUserStore from '../store/useUserStore';
import MessageFeed from '../components/journal/MessageFeed';
import ComposeBar from '../components/journal/ComposeBar';
import WeeklySummary from '../components/summary/WeeklySummary';

export default function Journal() {
  const { t } = useTranslation();
  const messages = useMessageStore((s) => s.messages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const removeMessage = useMessageStore((s) => s.removeMessage);
  const editMessage = useMessageStore((s) => s.editMessage);
  const name = useUserStore((s) => s.name);

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          {t('onboarding.welcome', { name })}
        </h1>
      </header>

      <WeeklySummary />

      <MessageFeed messages={messages} onDelete={removeMessage} onEdit={editMessage} />

      <ComposeBar onSend={addMessage} />
    </div>
  );
}
