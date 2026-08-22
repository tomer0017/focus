import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

interface EditButtonProps {
  /** Included in the accessible name, e.g. "Edit Sorcol". */
  targetLabel: string;
  onClick: () => void;
  className?: string;
}

/** Small pencil affordance: a real button with a real accessible name. */
export function EditButton({ targetLabel, onClick, className }: EditButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      variant="link"
      size="sm"
      className={`focus-icon-button text-secondary ${className ?? ""}`}
      onClick={onClick}
      aria-label={t("actions.editNamed", { name: targetLabel })}
    >
      <Icon name="edit" size={16} />
    </Button>
  );
}
