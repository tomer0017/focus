import Spinner from "react-bootstrap/Spinner";
import { useTranslation } from "react-i18next";

interface LoadingStateProps {
  label?: string;
}

/** Shared loading indicator. Announced to screen readers via role="status". */
export function LoadingState({ label }: LoadingStateProps) {
  const { t } = useTranslation();

  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-4" role="status">
      <Spinner animation="border" size="sm" aria-hidden="true" />
      <span>{label ?? t("loading")}</span>
    </div>
  );
}
