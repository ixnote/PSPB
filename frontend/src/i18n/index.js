import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ha from './ha.json';

const savedLang = localStorage.getItem('pspba-lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ha: { translation: ha },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('pspba-lang', lng);
  document.documentElement.lang = lng;
});

document.documentElement.lang = savedLang;

export default i18n;
