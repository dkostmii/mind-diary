import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import useMessageStore from '../store/useMessageStore';
import ReflectCard from '../components/reflect/ReflectCard';
import ReflectComposeBar from '../components/reflect/ReflectComposeBar';
import HelpModal from '../components/shared/HelpModal';
import FixedHeader from '../components/shared/FixedHeader';

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
  const [helpOpen, setHelpOpen] = useState(false);

  const targetId = searchParams.get('id');
  const message = targetId
    ? messages.find((m) => m.id === targetId && !m.reflection)
    : getNextReflectionEntry(messages);

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

  if (!message) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <FixedHeader className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
          {headerContent}
        </FixedHeader>
        <div className="flex-1 flex items-center justify-center p-8 min-h-0">
          <p className="text-stone-400 dark:text-stone-500 text-center text-lg">
            {t('reflect.emptyState')}
          </p>
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
        <ReflectCard message={message} />
      </div>
      <ReflectComposeBar messageId={message.id} onReflect={addReflection} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
