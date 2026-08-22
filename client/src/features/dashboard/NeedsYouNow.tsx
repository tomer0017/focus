import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CompactList } from "../../components/ui/CompactRow";
import { selectNeedsYouNow } from "../../lib/dashboard";
import type { RelevanceItem } from "../../lib/relevance";
import { RelevanceRow } from "../reminders/RelevanceRow";

interface NeedsYouNowProps {
  items: RelevanceItem[];
  /** So the area below can exclude whatever was shown here. */
  onResolved?: (shown: RelevanceItem[]) => void;
}

/**
 * The first thing on the screen, and the only one that carries colour.
 *
 * Reserving the accent stripe for this one area is the whole design: if
 * "coloured" means "needs you now" everywhere and nothing else on the page is
 * tinted, the top of the overview is legible in a glance rather than read. Each
 * stripe is paired with the state written out, because the colour is a
 * reinforcement and never the message.
 *
 * Five rows, hard. Beyond that the honest answer is a count and a link to the
 * screen that lists them all — a triage surface that grows with your backlog is
 * a backlog, not a triage surface.
 */
export function NeedsYouNow({ items }: NeedsYouNowProps) {
  const { t } = useTranslation(["dashboard", "manage"]);
  const { visible, more } = selectNeedsYouNow(items);

  return (
    <section className="focus-dash-area">
      <h2 className="focus-section-title">{t("dashboard:now.title")}</h2>

      {visible.length === 0 ? (
        /* Small and quiet. Nothing urgent is good news, not an event. */
        <p className="focus-dash-empty">{t("dashboard:now.empty")}</p>
      ) : (
        <>
          <CompactList>
            {visible.map((item) => (
              <RelevanceRow key={item.id} item={item} />
            ))}
          </CompactList>

          {more > 0 && (
            <p className="focus-dash-more">
              <Link to="/reminders">{t("dashboard:now.more", { count: more })}</Link>
            </p>
          )}
        </>
      )}
    </section>
  );
}
