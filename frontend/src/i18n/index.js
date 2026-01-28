import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

const storedLanguage = localStorage.getItem("dg_lang");
const browserLanguage = navigator?.language?.toLowerCase() || "en";
const defaultLanguage = storedLanguage || (browserLanguage.startsWith("pt") ? "pt-BR" : "en");

if (!storedLanguage) {
  localStorage.setItem("dg_lang", defaultLanguage);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "pt-BR": { translation: ptBR }
  },
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export const setLanguage = (lang) => {
  i18n.changeLanguage(lang);
  localStorage.setItem("dg_lang", lang);
};

export default i18n;
