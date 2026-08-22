import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div>
      <button onClick={() => i18n.changeLanguage("he")}>🇮🇱 עברית</button>
      <button onClick={() => i18n.changeLanguage("en")}>🇬🇧 English</button>
    </div>
  );
};

export default LanguageSwitcher;