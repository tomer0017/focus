import { useTranslation } from "react-i18next";
import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { SAVED_LIMIT } from "../../lib/pageSelectors";
import type { SavedItem } from "../../types";

interface SavedItemsRowProps {
  items: SavedItem[];
  title?: string;
  limit?: number;
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/** Visual row of saved content, built from the shared saved-item card. */
export function SavedItemsRow({ items, title, limit = SAVED_LIMIT, span }: SavedItemsRowProps) {
  const { t } = useTranslation(["dashboard"]);
  const visible = items.slice(0, limit);

  return (
    <Section
      title={title ?? t("dashboard:sections.saved")}
      hasContent={visible.length > 0}
      span={span ?? spanFor(visible.length)}
    >
      <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
        {visible.map((item) => (
          <li key={item.id}>
            <SavedItemCard item={item} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
