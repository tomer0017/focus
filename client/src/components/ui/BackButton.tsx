import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "./Icon";

/**
 * Back returns to wherever the user came from — including its space filter and
 * search query — via history. Direct arrivals (a shared link, a refresh) have
 * no history entry to return to, so they fall back to the overview.
 */
export function BackButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = (): void => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <Button variant="light" size="sm" className="focus-back border" onClick={goBack}>
      <Icon name="arrowBack" size={16} flipForRtl />
      {t("actions.back")}
    </Button>
  );
}
