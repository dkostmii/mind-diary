import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import useMessageStore from '../store/useMessageStore';
import ReflectCard from '../components/reflect/ReflectCard';

function getNextReflectionEntry(messages) {
  return messages
    .filter((m) => m.reflection === null)
    .sort((a, b) => a.createdAt - b.createdAt)[0];
}

export default function Reflect() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const messages = useMessageStore((s) => s.messages);
  const addReflection = useMessageStore((s) => s.addReflection);

  const targetId = searchParams.get('id');
  const message = targetId
    ? messages.find((m) => m.id === targetId && !m.reflection)
    : getNextReflectionEntry(messages);

  if (!message) {
    return (
      <div className="flex flex-col h-full">
        <header className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
          <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
            {t('reflect.title')}
          </h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-stone-400 dark:text-stone-500 text-center text-lg">
            {t('reflect.emptyState')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
          {t('reflect.title')}
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ReflectCard message={message} onReflect={addReflection} />
      </div>
    </div>
  );
}
