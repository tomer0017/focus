import { useTranslation } from "react-i18next";

/**
 * Small development marker, shown once in the header.
 *
 * It replaced a full-width banner repeated on every screen: the banner cost a
 * row of vertical space on all ten screens to say something that is true of
 * the whole app, not of any one page.
 */
export function DemoBadge() {
  const { t } = useTranslation();

  return (
    <span className="focus-demo-badge" title={t("mock.hint")}>
      {t("mock.label")}
    </span>
  );
}
