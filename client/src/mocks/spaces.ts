import type { Space, SpaceId } from "../types";

/** Display names live in the `common:spaces` translation namespace, by id. */
export const SPACES: Space[] = [
  { id: "work-tech", accent: "primary", icon: "work" },
  { id: "personal", accent: "info", icon: "personal" },
  { id: "home", accent: "warning", icon: "home" },
  { id: "cooking", accent: "danger", icon: "cooking" },
  { id: "trips", accent: "success", icon: "trips" },
];

const SPACE_BY_ID = new Map<SpaceId, Space>(SPACES.map((space) => [space.id, space]));

export function getSpace(id: SpaceId): Space {
  const space = SPACE_BY_ID.get(id);
  if (!space) {
    // Unreachable while SpaceId stays a closed union; guards future widening.
    throw new Error(`Unknown space: ${id}`);
  }
  return space;
}

export function isSpaceId(value: string | null | undefined): value is SpaceId {
  return value != null && SPACE_BY_ID.has(value as SpaceId);
}
