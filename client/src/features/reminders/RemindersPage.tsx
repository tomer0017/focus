import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CompactList } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { InfoNote } from "../../components/ui/InfoNote";
import { PageHeader } from "../../components/ui/PageHeader";
import { Section } from "../sections/Section";
import { ShowMore } from "../../components/ui/ShowMore";
import { snoozedRelevance } from "../../lib/relevance";
import { useManage } from "../../state/manageContext";
import { ScheduledRow } from "../manage/ScheduledRow";
import { RelevanceRow } from "./RelevanceRow";
import { useRelevance } from "./useRelevance";

/**
 * The reminder centre.
 *
 * Everything the overview shows, plus the one thing it deliberately hides: what
 * has been snoozed. A snoozed item is still owed, and an app where "later"
 * means "gone" teaches people not to press it — so there is exactly one place
 * that lists them, and it is here.
 *
 * The limitation is stated at the top rather than buried: Focus shows reminders
 * when you open it and cannot deliver anything while the tab is closed. There
 * is no server and no push, and implying otherwise would be the single most
 * damaging thing this screen could do.
 */
export function RemindersPage() {
  const { t } = useTranslation(["manage", "common"]);
  const { scheduled } = useManage();
  const { grouped, items } = useRelevance();

  const snoozed = useMemo(() => snoozedRelevance(scheduled), [scheduled]);

  const due = [...grouped.today, ...grouped.waiting];
  const upcoming = [...grouped.week, ...grouped.upcoming, ...grouped.recurring];

  return (
    <>
      <PageHeader title={t("manage:reminders.title")} lead={t("manage:reminders.lead")} />

      <div className="mb-3">
        <InfoNote>{t("manage:reminders.localOnly")}</InfoNote>
      </div>

      {items.length === 0 && snoozed.length === 0 ? (
        <EmptyState
          title={t("manage:reminders.empty")}
          hint={t("manage:reminders.emptyHint")}
        />
      ) : (
        <div className="focus-sections">
          <Section title={t("manage:reminders.due")} hasContent={due.length > 0} span="full">
            <CompactList>
              {due.map((item) => (
                <RelevanceRow key={item.id} item={item} />
              ))}
            </CompactList>
          </Section>

          <Section
            title={t("manage:reminders.upcoming")}
            hasContent={upcoming.length > 0}
            span="full"
          >
            <ShowMore items={upcoming} limit={6}>
              {(visible) => (
                <CompactList>
                  {visible.map((item) => (
                    <RelevanceRow key={item.id} item={item} />
                  ))}
                </CompactList>
              )}
            </ShowMore>
          </Section>

          {/* Snoozed items are rendered as full scheduled rows, because the one
              action they need is "reopen", which lives there. */}
          <Section
            title={t("manage:reminders.snoozed")}
            hasContent={snoozed.length > 0}
            span="full"
          >
            <ShowMore items={snoozed} limit={6}>
              {(visible) => (
                <CompactList>
                  {visible.map((item) => (
                    <ScheduledRow key={item.id} item={item} />
                  ))}
                </CompactList>
              )}
            </ShowMore>
          </Section>
        </div>
      )}
    </>
  );
}
