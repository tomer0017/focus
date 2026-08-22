import { useMemo } from "react";
import { collectRelevance, groupRelevance, openReminderCount } from "../../lib/relevance";
import type { RelevanceBucket, RelevanceItem } from "../../lib/relevance";
import { useEvents } from "../../state/eventsContext";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import { usePages } from "../../state/pagesContext";

export interface RelevanceResult {
  items: RelevanceItem[];
  grouped: Record<RelevanceBucket, RelevanceItem[]>;
  /** What the bell shows. Only things due today or already owed. */
  openCount: number;
}

/**
 * Everything currently asking for something, from every slice at once.
 *
 * One hook rather than each screen assembling its own inputs: the overview, the
 * reminder centre and the header badge must agree about what "needs you" means,
 * and three call sites building three slightly different inputs is exactly how
 * they would stop agreeing.
 */
export function useRelevance(): RelevanceResult {
  const { scheduled, commitments, money, medications } = useManage();
  const { events } = useEvents();
  const { profiles } = useFamily();
  const { pages } = usePages();

  return useMemo(() => {
    const items = collectRelevance({
      scheduled,
      events,
      profiles,
      commitments,
      money,
      medications,
      pages,
    });
    return {
      items,
      grouped: groupRelevance(items),
      openCount: openReminderCount(items),
    };
  }, [scheduled, events, profiles, commitments, money, medications, pages]);
}
