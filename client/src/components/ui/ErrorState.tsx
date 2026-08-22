import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  title?: string;
  /** Safe, human-readable message. Never a raw stack trace. */
  message: string;
  /** Correlation id from the API, shown so a report can be traced. */
  requestId?: string;
  onRetry?: () => void;
}

/**
 * Shared error panel — the single place errors are shown to the user.
 * `alert()` is never used anywhere in this app.
 */
export function ErrorState({ title, message, requestId, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="alert alert-danger rounded-3 mb-0" role="alert">
      <h2 className="h6 alert-heading">{title ?? t("errors.genericTitle")}</h2>
      <p className="mb-2 small">{message}</p>
      {requestId && (
        <p className="mb-2 small text-body-secondary font-monospace">
          {t("errors.requestId", { id: requestId })}
        </p>
      )}
      {onRetry && (
        <Button variant="outline-danger" size="sm" onClick={onRetry}>
          {t("actions.tryAgain")}
        </Button>
      )}
    </div>
  );
}
