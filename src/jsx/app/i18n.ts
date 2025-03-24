import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enNs from "../../data/en.json"
import frNs from "../../data/fr.json"
import esNs from "../../data/es.json"
import bgNs from "../../data/bg.json"
import huNs from "../../data/hu.json"
import itNs from "../../data/it.json"

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: false,
    fallbackLng: 'en-US',
    nonExplicitSupportedLngs: true,
    supportedLngs: ['en-US', 'en-GB', 'en', 'fr', 'es', 'bg', 'hu', 'it'],
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources:{
      en:enNs,
      fr:frNs,
      es:esNs,
      bg:bgNs,
      hu:huNs,
      it:itNs
    }
  });

export default i18n;