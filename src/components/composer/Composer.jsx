import { useCallback } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { decomposeEntry } from '../../engine/decompose';
import useNodeStore from '../../store/useNodeStore';
import SharedComposer from '../shared/Composer';

export default function Composer({ disabled = false }) {
  const { t } = useTranslation();
  const addNodes = useNodeStore((s) => s.addNodes);

  const handleSubmit = useCallback(async (text, images, location) => {
    const attachments = [];

    for (const img of (images || [])) {
      attachments.push({ type: 'photo', data: img });
    }

    if (location) {
      attachments.push({
        type: 'location',
        name: location.name || '',
        lat: location.lat,
        lng: location.lng,
      });
    }

    const atoms = decomposeEntry(text, attachments);
    if (atoms.length > 0) {
      await addNodes(atoms);
    }
  }, [addNodes]);

  return (
    <SharedComposer
      placeholder={t('composer.placeholder')}
      buttonLabel={t('composer.send')}
      buttonIcon={Send}
      onSubmit={handleSubmit}
      disabled={disabled}
    />
  );
}
