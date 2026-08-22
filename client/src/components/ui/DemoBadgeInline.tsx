import { useTranslation } from "react-i18next";

/**
 * Marks a saved item that has no real destination.
 *
 * Being honest about this is the whole fix: the alternative — pointing the card
 * at a placeholder host so it "has a link" — produces something that looks like
 * a working link and lands the user on a parking page.
 */
export function DemoBadgeInline() {
  const { t } = useTranslation();
  return (
    <span className="focus-demo-inline" title={t("mock.noLinkHint")}>
      {t("mock.noLink")}
    </span>
  );
}
