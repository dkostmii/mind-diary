import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from '../../i18n';
import LocationViewModal from './LocationViewModal';

export default function LocationButton({ location }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!location) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors mt-2"
      >
        <MapPin size={14} />
        {location.name || t('common.somePlace')}
      </button>
      <LocationViewModal
        location={location}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
