import { createContext, useContext } from 'react';
import uk from './uk';
import en from './en';

const translations = { uk, en };
const LanguageContext = createContext('uk');

export function LanguageProvider({ language, children }) {
  return (
    <LanguageContext.Provider value={language}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const lang = useContext(LanguageContext);
  const dict = translations[lang] || translations.uk;

  function t(key, vars = {}) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], dict) || key;
    return typeof value === 'string'
      ? value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
      : value;
  }

  return { t, lang };
}
