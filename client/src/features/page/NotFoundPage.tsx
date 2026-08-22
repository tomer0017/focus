import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/ui/EmptyState";

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="focus-detail">
      <h1 className="focus-page-title">{t("errors.routeNotFoundTitle")}</h1>
      <EmptyState
        title={t("errors.routeNotFoundBody")}
        hint={t("errors.routeNotFoundHint")}
        action={
          <Link to="/" className="btn btn-primary btn-sm">
            {t("errors.backToOverview")}
          </Link>
        }
      />
    </div>
  );
}
