import { useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Composer from '../shared/Composer';

export default function ReflectComposeBar({ messageId, onReflect }) {
  const { t } = useTranslation();

  const handleSubmit = useCallback(
    (text, images) => onReflect(messageId, text, images),
    [messageId, onReflect]
  );

  return (
    <Composer
      placeholder={t('reflect.placeholder')}
      buttonLabel={t('reflect.action')}
      buttonIcon={MessageCircle}
      onSubmit={handleSubmit}
    />
  );
}
