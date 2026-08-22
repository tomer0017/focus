import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { PagedList } from "../../components/ui/PagedList";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { usePages } from "../../state/pagesContext";
import type { LearningLevel, PageStatus, PageSummary } from "../../types";
import { NewLearningModal } from "./NewLearningModal";

/** What is being learned now, what is on hold, what is finished. */
type Group = "active" | "paused" | "completed";

const GROUPS: Group[] = ["active", "paused", "completed"];
const LEVELS: LearningLevel[] = ["beginner", "intermediate", "advanced"];

/**
 * Everything being learned, grouped by whether it is actually being learned.
 *
 * The screen this replaces was one undivided list sorted by "active first",
 * which told a new reader nothing: the group boundary was invisible, so a
 * course abandoned two years ago sat in the same run as the one opened
 * yesterday. Three tabs make the distinction the screen was already trying to
 * express, and level becomes a filter rather than a second sort nobody can see.
 *
 * Each row still leads with the two facts that get somebody back in after a
 * gap — where they stopped and what to do next. The level, the goal and the
 * method are on the detail screen: useful once you are there, useless for
 * choosing which one to open.
 */
export function LearningPage() {
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();
  const { pages, savedItems } = usePages();

  const [creating, setCreating] = useState(false);
  const [group, setGroup] = useState<Group>("active");
  const [level, setLevel] = useState<LearningLevel | "all">("all");

  const learning = useMemo(
    () =>
      pages
        .filter((page) => page.type === "learning")
        // Most recently *studied* first — tidying the notes is not studying, so
        // `lastUpdatedAt` is only the fallback.
        .sort((a, b) => {
          const left = a.learning?.lastStudiedAt ?? a.lastUpdatedAt;
          const right = b.learning?.lastStudiedAt ?? b.lastUpdatedAt;
          return right.localeCompare(left);
        }),
    [pages]
  );

  const inGroup = (page: PageSummary, value: Group): boolean =>
    page.status === (value as PageStatus);

  const listed = learning.filter(
    (page) =>
      inGroup(page, group) && (level === "all" || page.learning?.level === level)
  );

  const tabs = GROUPS.map((value) => ({
    id: value,
    label: t(`pages:learning.groups.${value}`),
    badge: String(learning.filter((page) => inGroup(page, value)).length || ""),
  }));

  /*
   * The level filter only appears once something has a level on it. On a fresh
   * install nothing does, and three chips that all return the same list are
   * controls teaching the user nothing.
   */
  const hasLevels = learning.some((page) => page.learning?.level);
  const levelOptions: FilterOption<LearningLevel | "all">[] = [
    { value: "all", label: t("pages:learning.levels.all") },
    ...LEVELS.map((value) => ({
      value,
      label: t(`pages:learning.levels.${value}`),
      count: learning.filter((page) => page.learning?.level === value).length,
    })),
  ];

  const addAction = (
    <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
      <Icon name="plus" size={14} /> {t("pages:learning.add")}
    </Button>
  );

  if (learning.length === 0) {
    return (
      <>
        <CollectionPage
          title={t("pages:learning.title")}
          lead={t("pages:learning.lead")}
          action={addAction}
        >
          <EmptyState title={t("pages:learning.empty")} hint={t("pages:learning.emptyHint")} />
        </CollectionPage>
        <NewLearningModal show={creating} onClose={() => setCreating(false)} />
      </>
    );
  }

  return (
    <>
      <CollectionPage
        title={t("pages:learning.title")}
        lead={t("pages:learning.lead")}
        action={addAction}
        tabs={tabs}
        tabValue={group}
        onTabChange={(id) => setGroup(id as Group)}
        tabsLabel={t("pages:learning.chooseGroup")}
        toolbar={
          hasLevels ? (
            <FilterChips
              label={t("pages:learning.levelLabel")}
              options={levelOptions}
              value={level}
              onChange={setLevel}
            />
          ) : undefined
        }
      >
        {listed.length === 0 ? (
          <p className="focus-day-empty mb-0">{t("pages:learning.noneInGroup")}</p>
        ) : (
          <PagedList items={listed} pageSize={20} resetKey={`${group}|${level}`}>
            {(visible) => (
              <CompactList>
                {visible.map((page) => {
                  const studied = page.learning?.lastStudiedAt;
                  const resources = savedItems.filter((item) =>
                    item.contextIds.includes(page.id)
                  ).length;
                  return (
                    <li key={page.id}>
                      <CompactRow
                        title={page.title}
                        href={`/pages/${page.id}`}
                        eyebrow={
                          page.learning?.level
                            ? t(`pages:learning.levels.${page.learning.level}`)
                            : undefined
                        }
                        detail={page.stoppedAt ?? page.nextAction ?? page.description}
                        badges={
                          resources > 0 ? (
                            <span className="focus-chip focus-chip--muted">
                              {t("pages:learning.resources")}: {resources}
                            </span>
                          ) : undefined
                        }
                        meta={
                          <span>
                            {studied
                              ? t("pages:learning.lastStudied", {
                                  when: formatRelativeDay(studied, locale),
                                })
                              : t("pages:learning.neverStudied")}
                          </span>
                        }
                      />
                    </li>
                  );
                })}
              </CompactList>
            )}
          </PagedList>
        )}

        {/* Said once, at the bottom: this is not a course platform. */}
        <div className="mt-3">
          <InfoNote>{t("pages:learning.noLms")}</InfoNote>
        </div>
      </CollectionPage>

      <NewLearningModal show={creating} onClose={() => setCreating(false)} />
    </>
  );
}
