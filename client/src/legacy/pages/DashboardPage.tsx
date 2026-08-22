import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/common/LanguageSwitcher";

const DashboardPage = () => {
  const { t } = useTranslation();

    return  (
    <div>
      <LanguageSwitcher/>
      <h3>{t("dashboard.title")}</h3>

    </div>
    )
  };
  
  export default DashboardPage;
