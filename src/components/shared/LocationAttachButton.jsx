import { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { MAPBOX_TOKEN } from '../../utils/mapbox';
import LocationPicker from './LocationPicker';

export default function LocationAttachButton({ location, onChange, label, fullWidth }) {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!MAPBOX_TOKEN) return null;

  const picker = pickerOpen && createPortal(
    <LocationPicker
      open={pickerOpen}
      initialLocation={location}
      onConfirm={(loc) => { onChange(loc); setPickerOpen(false); }}
      onClose={() => setPickerOpen(false)}
    />,
    document.body
  );

  if (location) {
    return (
      <>
        <div className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
          <MapPin size={14} />
          <span className="truncate max-w-[120px]">
            {location.name || t('common.somePlace')}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="ml-1 p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
        {picker}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-stone-400 hover:text-indigo-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${label ? 'px-3 py-1.5 text-sm' : 'p-2'} ${fullWidth ? 'flex-1' : ''}`}
        aria-label={t('common.attachLocation')}
      >
        <MapPin size={label ? 16 : 20} />
        {label && <span>{label}</span>}
      </button>
      {picker}
    </>
  );
}
