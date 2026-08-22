import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { OverflowMenu, type OverflowAction } from "../../components/ui/OverflowMenu";
import { PagedList } from "../../components/ui/PagedList";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { todayKey } from "../../lib/dateKey";
import {
  LEARNING_GROUPS,
  inLearningGroup,
  isLearningGroup,
  learningPages,
  learningResources,
  topicLabel,
  topicOf,
  type LearningGroup,
} from "../../lib/learning";
import { usePages } from "../../state/pagesContext";
import type { PageSummary } from "../../types";
import { NewLearningModal } from "./NewLearningModal";

/** The filter value for pages the user has not filed under a subject. */
const UNFILED = "unfiled";

/**
 * Everything being learned.
 *
 * Two questions, in this order, and then a list: *am I on this now* (the tabs)
 * and *what is it about* (the chips). Nothing else — no search, no sort menu,
 * no counters across the top. A personal learning list is twenty things, and
 * the thing somebody actually came here to do is open one of them.
 *
 * Each row carries the four facts that decide which one to open: the subject,
 * the level, where they stopped, and how much material is already saved. The
 * goal, the method and the plan are on the detail screen, where they are useful
 * — on this screen they would be four more lines to read past.
 *
 * Both filters live in the URL, so a refresh, the back button and a link all
 * land on the same list.
 */
export function LearningPage() {
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();
  const { pages, savedItems, learningTopics, markStudied, setPageStatus } = usePages();
  const [params, setParams] = useSearchParams();

  const [creating, setCreating] = useState(false);

  const group: LearningGroup = isLearningGroup(params.get("group"))
    ? (params.get("group") as LearningGroup)
    : "active";
  const topic = params.get("topic") ?? "all";

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(params);
    if (value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const learning = useMemo(() => learningPages(pages), [pages]);

  const inTopic = (page: PageSummary): boolean =>
    topic === "all" ||
    (topic === UNFILED ? topicOf(page) === undefined : topicOf(page) === topic);

  const byTopic = learning.filter(inTopic);
  const listed = byTopic.filter((page) => inLearningGroup(page, group));

  const tabs = LEARNING_GROUPS.map((value) => ({
    id: value,
    label: t(`pages:learning.groups.${value}`),
    badge: String(byTopic.filter((page) => inLearningGroup(page, value)).length || ""),
  }));

  /*
   * A subject chip only appears once something is filed under it, and "unfiled"
   * only once something is not. Chips that all return the same list are
   * controls teaching the user nothing, and an empty one is a dead end.
   */
  const unfiled = learning.filter((page) => topicOf(page) === undefined).length;
  const topicOptions: FilterOption<string>[] = [
    { value: "all", label: t("pages:learning.topics.all"), count: learning.length },
    ...learningTopics
      .map((entry) => ({
        value: entry.id,
        label: topicLabel(learningTopics, entry.id, t) ?? entry.id,
        count: learning.filter((page) => topicOf(page) === entry.id).length,
      }))
      .filter((option) => option.count > 0),
    ...(unfiled > 0
      ? [{ value: UNFILED, label: t("pages:learning.topics.unfiled"), count: unfiled }]
      : []),
  ];

  const addAction = (
    <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
      <Icon name="plus" size={14} /> {t("pages:learning.add")}
    </Button>
  );

  const actionsFor = (page: PageSummary): OverflowAction[] => {
    const studiedToday = page.learning?.lastStudiedAt?.slice(0, 10) === todayKey();
    const actions: OverflowAction[] = [];

    if (!studiedToday) {
      actions.push({
        id: "studied",
        label: t("pages:learning.markStudied"),
        onSelect: () => markStudied(page.id),
      });
    }
    if (page.status !== "active") {
      actions.push({
        id: "resume",
        label: t("pages:learning.actions.resume"),
        onSelect: () => setPageStatus(page.id, "active"),
      });
    }
    if (page.status !== "paused") {
      actions.push({
        id: "hold",
        label: t("pages:learning.actions.hold"),
        onSelect: () => setPageStatus(page.id, "paused"),
      });
    }
    if (page.status !== "completed") {
      actions.push({
        id: "finish",
        label: t("pages:learning.actions.finish"),
        onSelect: () => setPageStatus(page.id, "completed"),
      });
    }
    return actions;
  };

  if (learning.length === 0) {
    return (
      <>
        <CollectionPage
          title={t("pages:learning.title")}
          lead={t("pages:learning.lead")}
          action={addAction}
        >
          <EmptyState
            title={t("pages:learning.empty")}
            hint={t("pages:learning.emptyHint")}
            action={addAction}
          />
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
        onTabChange={(id) => setParam("group", id)}
        tabsLabel={t("pages:learning.chooseGroup")}
        toolbar={
          topicOptions.length > 1 ? (
            <FilterChips
              label={t("pages:learning.topicLabel")}
              options={topicOptions}
              value={topic}
              onChange={(value) => setParam("topic", value)}
            />
          ) : undefined
        }
      >
        {listed.length === 0 ? (
          <p className="focus-day-empty mb-0">{t("pages:learning.noneInGroup")}</p>
        ) : (
          <PagedList items={listed} pageSize={15} resetKey={`${group}|${topic}`}>
            {(visible) => (
              <CompactList>
                {visible.map((page) => {
                  const facts = page.learning ?? {};
                  const resources = learningResources(page, savedItems).length;
                  const subject = topicLabel(learningTopics, topicOf(page), t);
                  return (
                    <li key={page.id}>
                      <CompactRow
                        title={page.title}
                        href={`/pages/${page.id}`}
                        leading={<Thumbnail imageUrl={page.visionImageUrl} size="sm" />}
                        eyebrow={subject}
                        detail={page.stoppedAt ?? page.nextAction ?? facts.goal}
                        badges={
                          <>
                            {facts.level && (
                              <span className="focus-chip focus-chip--primary">
                                {t(`pages:learning.levels.${facts.level}`)}
                              </span>
                            )}
                            {/* The state is spelled out whenever the tab is not
                                already saying it. */}
                            {group === "all" && (
                              <span className="focus-chip focus-chip--muted">
                                {t(`pages:learning.groups.${page.status}`)}
                              </span>
                            )}
                            {resources > 0 && (
                              <span className="focus-chip focus-chip--muted">
                                {t("pages:learning.resourceCount", { count: resources })}
                              </span>
                            )}
                          </>
                        }
                        meta={
                          <span>
                            {facts.lastStudiedAt
                              ? t("pages:learning.lastStudied", {
                                  when: formatRelativeDay(facts.lastStudiedAt, locale),
                                })
                              : t("pages:learning.neverStudied")}
                          </span>
                        }
                        actions={
                          <OverflowMenu label={page.title} actions={actionsFor(page)} />
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
