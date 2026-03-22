import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTranslation } from '../../i18n';
import LinkifyText from '../shared/LinkifyText';
import ImageThumbnails from '../shared/ImageThumbnails';

export default function ReflectCard({ message }) {
  const { t, lang } = useTranslation();
  const locale = lang === 'uk' ? { locale: uk } : {};
  const dateStr = format(new Date(message.createdAt), 'd MMMM yyyy', locale);

  return (
    <div className="p-4">
      <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-4">
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">
          {t('reflect.originalDate', { date: dateStr })}
        </p>
        <p className="text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words">
          <LinkifyText>{message.text}</LinkifyText>
        </p>
        <ImageThumbnails images={message.images} />
      </div>
    </div>
  );
}
