import { useCallback } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { decomposeEntry } from '../../engine/decompose';
import useNodeStore from '../../store/useNodeStore';
import SharedComposer from '../shared/Composer';

export default function StepWrite({ onComplete, promptKey = 'onboarding.writePrompt' }) {
  const { t } = useTranslation();
  const addNodes = useNodeStore((s) => s.addNodes);

  const handleSubmit = useCallback(async (text, images, location) => {
    const attachments = [];
    for (const img of (images || [])) {
      attachments.push({ type: 'photo', data: img });
    }
    if (location) {
      attachments.push({ type: 'location', name: location.name || '', lat: location.lat, lng: location.lng });
    }

    const atoms = decomposeEntry(text, attachments);
    if (atoms.length > 0) {
      await addNodes(atoms);
      onComplete(atoms);
    }
  }, [addNodes, onComplete]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 text-center space-y-4">
        <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200">
          {t(promptKey)}
        </h2>
      </div>
      <SharedComposer
        placeholder={t('composer.placeholder')}
        buttonLabel={t('composer.send')}
        buttonIcon={Send}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
