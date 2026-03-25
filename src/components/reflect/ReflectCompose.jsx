import { MessageCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Composer from '../shared/Composer';

export default function ReflectCompose({ onSave, disabled }) {
  const { t } = useTranslation();

  return (
    <Composer
      placeholder={t('reflect.composePlaceholder')}
      buttonLabel={t('reflect.save')}
      buttonIcon={MessageCircle}
      onSubmit={onSave}
      allowEmpty
      disabled={disabled}
    />
  );
}
