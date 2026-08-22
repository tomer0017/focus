import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar } from "../../components/ui/Avatar";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { InfoNote } from "../../components/ui/InfoNote";
import { Section } from "../sections/Section";
import { useLocale } from "../../i18n/useLocale";
import { formatMoney, formatShortDate } from "../../lib/format";
import { isSensitiveCategory } from "../../lib/pageSelectors";
import { useExtraSearch } from "./useExtraSearch";

/**
 * Search results for the slices the ongoing-management and family areas added,
 * grouped by kind.
 *
 * The health rule is enforced here rather than trusted to each row: an
 * appointment, a follow-up or a vaccination prints its **title and its
 * category, and nothing else**. Search matches on the note, the location and
 * the recorded result — you can still find the thing — but a list of results
 * is a surface somebody can read over your shoulder, and a blood-test result is
 * not something to put in one.
 */
export function ExtraResults({ query }: { query: string }) {
  const { t } = useTranslation(["common", "manage", "family", "leisure"]);
  const { locale } = useLocale();
  const {
    scheduled: foundScheduled,
    commitments: foundCommitments,
    profiles: foundProfiles,
    leisure: foundLeisure,
    menus: foundMenus,
  } = useExtraSearch(query);

  const anySensitive = foundScheduled.some((item) => isSensitiveCategory(item.category));

  return (
    <>
      <Section
        title={t("common:search.matchingProfiles")}
        hasContent={foundProfiles.length > 0}
      >
        <div className="focus-profile-grid">
          {foundProfiles.map((profile) => (
            <article key={profile.id} className="focus-profile-card">
              <Avatar name={profile.name} photoUrl={profile.photoUrl} size={36} />
              <div className="focus-profile-card__body">
                <h3 className="focus-profile-card__name">
                  <Link to={`/family/${profile.id}`} className="stretched-link" dir="auto">
                    {profile.name}
                  </Link>
                </h3>
                {profile.relationship && (
                  <p className="focus-profile-card__relation" dir="auto">
                    {profile.relationship}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section
        title={t("common:search.matchingScheduled")}
        hasContent={foundScheduled.length > 0}
      >
        <CompactList>
          {foundScheduled.map((item) => (
            <li key={item.id}>
              <CompactRow
                title={item.title}
                eyebrow={t(`manage:categories.${item.category}`)}
                /* Nothing else for a health record — see the note above. */
                detail={isSensitiveCategory(item.category) ? undefined : item.note}
                href={item.relatedEntity?.kind === "family" ? `/family/${item.relatedEntity.id}` : "/manage"}
                meta={
                  item.dueAt ? (
                    <time dateTime={item.dueAt}>{formatShortDate(item.dueAt, locale)}</time>
                  ) : undefined
                }
              />
            </li>
          ))}
        </CompactList>
        {anySensitive && (
          <div className="mt-2">
            <InfoNote>{t("common:search.sensitiveHidden")}</InfoNote>
          </div>
        )}
      </Section>

      <Section
        title={t("common:search.matchingCommitments")}
        hasContent={foundCommitments.length > 0}
      >
        <CompactList>
          {foundCommitments.map((item) => (
            <li key={item.id}>
              <CompactRow
                title={item.title}
                eyebrow={item.provider}
                href="/manage?view=money"
                meta={
                  item.amount !== undefined ? (
                    <span>{formatMoney(item.amount, locale, item.currency)}</span>
                  ) : undefined
                }
              />
            </li>
          ))}
        </CompactList>
      </Section>

      <Section title={t("common:search.matchingMenus")} hasContent={foundMenus.length > 0}>
        <CompactList>
          {foundMenus.map((menu) => (
            <li key={menu.id}>
              <CompactRow
                title={menu.title ?? t(`manage:menuKinds.${menu.kind}`)}
                eyebrow={t(`manage:menuKinds.${menu.kind}`)}
                href={`/manage/menus/${menu.id}`}
              />
            </li>
          ))}
        </CompactList>
      </Section>

      <Section title={t("common:search.matchingLeisure")} hasContent={foundLeisure.length > 0}>
        <CompactList>
          {foundLeisure.map((item) => (
            <li key={item.id}>
              <CompactRow
                title={item.title}
                eyebrow={t(`leisure:kinds.${item.kind}`)}
                detail={item.note}
                href="/leisure"
                meta={
                  item.tags.length > 0 ? <span dir="auto">{item.tags.slice(0, 2).join(" · ")}</span> : undefined
                }
              />
            </li>
          ))}
        </CompactList>
      </Section>
    </>
  );
}
