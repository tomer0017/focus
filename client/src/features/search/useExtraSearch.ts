import { useMemo } from "react";
import {
  searchCommitments,
  searchLeisure,
  searchMenus,
  searchProfiles,
  searchScheduled,
} from "../../lib/pageSelectors";
import { useFamily } from "../../state/familyContext";
import { useLeisure } from "../../state/leisureContext";
import { useManage } from "../../state/manageContext";
import type { Commitment, FamilyProfile, LeisureItem, Menu, ScheduledItem } from "../../types";

export interface ExtraSearchResult {
  profiles: FamilyProfile[];
  scheduled: ScheduledItem[];
  commitments: Commitment[];
  menus: Menu[];
  leisure: LeisureItem[];
  total: number;
}

/**
 * Search across the ongoing-management, family and leisure slices.
 *
 * A hook rather than five calls inside the results component, because two
 * places need the answer: the component that renders the groups, and the one
 * that decides whether to print "nothing matches". Running the searches twice
 * would let those two disagree, and the visible symptom of that disagreement is
 * an empty state sitting above a list of results.
 */
export function useExtraSearch(query: string): ExtraSearchResult {
  const { scheduled, commitments, menus } = useManage();
  const { profiles } = useFamily();
  const { items } = useLeisure();

  return useMemo(() => {
    const found = {
      profiles: searchProfiles(profiles, query),
      scheduled: searchScheduled(scheduled, query),
      commitments: searchCommitments(commitments, query),
      menus: searchMenus(menus, query),
      leisure: searchLeisure(items, query),
    };
    return {
      ...found,
      total:
        found.profiles.length +
        found.scheduled.length +
        found.commitments.length +
        found.menus.length +
        found.leisure.length,
    };
  }, [profiles, scheduled, commitments, menus, items, query]);
}
