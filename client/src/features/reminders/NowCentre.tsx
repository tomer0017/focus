import { useTranslation } from "react-i18next";
import { CompactList } from "../../components/ui/CompactRow";
import { InfoNote } from "../../components/ui/InfoNote";
import { ShowMore } from "../../components/ui/ShowMore";
import { BUCKET_LIMIT, RELEVANCE_BUCKETS, type RelevanceBucket } from "../../lib/relevance";
import { RelevanceRow } from "./RelevanceRow";
import { useRelevance } from "./useRelevance";

interface NowCentreProps {
  /** Hides the whole block when nothing is relevant, for the overview. */
  hideWhenEmpty?: boolean;
  /**
   * Render only these buckets.
   *
   * The overview groups itself into today / this week / later on a phone, and
   * those *are* three of these five buckets — so it asks for them one group at
   * a time rather than printing all five under "today" and grouping the same
   * rows twice. Omitted, every bucket renders, which is what the reminders
   * screen wants.
   */
  buckets?: RelevanceBucket[];
  /** Suppresses the heading when the caller supplies its own. */
  hideTitle?: boolean;
}

/**
 * "What needs you" — five groups, three rows each.
 *
 * The restraint is the feature. Focus can see insurance, subscriptions,
 * medicines, appointments, birthdays, pet treatments, shopping lists, learning
 * pages and evening ideas; showing all of that would produce a worse inbox than
 * the one the user is already ignoring. So a row appears only once it has
 * *become* relevant, each group caps at three before "show more", and a group
 * with nothing in it renders nothing at all.
 *
 * The honest line about local reminders sits at the bottom, once.
 */
export function NowCentre({ hideWhenEmpty, buckets, hideTitle }: NowCentreProps) {
  const { t } = useTranslation(["manage", "common"]);
  const { grouped, items } = useRelevance();

  const wanted = buckets ?? RELEVANCE_BUCKETS;
  const populated = wanted.filter((bucket) => grouped[bucket].length > 0);

  // Nothing in *these* buckets is as empty as nothing at all, for a caller
  // that asked for a subset.
  if (items.length === 0 || (buckets && populated.length === 0)) {
    if (hideWhenEmpty) return null;
    return (
      <section className="focus-panel">
        <h2 className="focus-panel__title">{t("manage:now.title")}</h2>
        <p className="focus-panel__lead mb-0">{t("manage:now.empty")}</p>
        <p className="focus-panel__lead mb-0">{t("manage:now.emptyHint")}</p>
      </section>
    );
  }

  return (
    <section className="focus-section focus-section--full">
      {!hideTitle && <h2 className="focus-section-title">{t("manage:now.title")}</h2>}

      <div className="focus-relevance">
        {populated.map((bucket) => (
          <div key={bucket} className="focus-panel">
            <h3 className="focus-relevance__group-title">
              {t(`manage:now.buckets.${bucket}`)}
              <span className="focus-relevance__count">{grouped[bucket].length}</span>
            </h3>
            <ShowMore items={grouped[bucket]} limit={BUCKET_LIMIT}>
              {(visible) => (
                <CompactList>
                  {visible.map((item) => (
                    <RelevanceRow key={item.id} item={item} />
                  ))}
                </CompactList>
              )}
            </ShowMore>
          </div>
        ))}
      </div>

      <div className="mt-2">
        <InfoNote>{t("manage:reminders.localOnly")}</InfoNote>
      </div>
    </section>
  );
}
