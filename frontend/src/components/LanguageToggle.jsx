import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n";

const options = [
  { code: "pt-BR", label: "PT-BR" },
  { code: "en", label: "EN" }
];

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language === "pt-BR" ? "pt-BR" : "en";

  return (
    <div className="lang-toggle" role="group" aria-label="Language toggle">
      {options.map((option) => (
        <button
          key={option.code}
          type="button"
          className={
            current === option.code ? "lang-option active" : "lang-option"
          }
          onClick={() => setLanguage(option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
