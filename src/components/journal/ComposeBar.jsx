import { PenLine } from 'lucide-react';
import { useTranslation } from '../../i18n';
import Composer from '../shared/Composer';

export default function ComposeBar({ onSend }) {
  const { t } = useTranslation();

  return (
    <Composer
      placeholder={t('journal.placeholder')}
      buttonLabel={t('journal.send')}
      buttonIcon={PenLine}
      onSubmit={onSend}
    />
  );
}
