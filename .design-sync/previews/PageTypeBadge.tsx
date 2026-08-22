import { PageTypeBadge, SpaceBadge, StatusBadge, PageHeader } from "focus-client";
import type { PageType } from "../../client/src/types";

/**
 * Seven page types, one muted chip. It never competes with the space accent or
 * the status beside it — the type is the quietest of the three facts a page
 * header states, because it is the one that never changes.
 */

const PAGE_TYPES: PageType[] = [
  "project",
  "collection",
  "checklist",
  "routine",
  "event",
  "showcase",
  "learning",
];

export const AllPageTypes = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    {PAGE_TYPES.map((type) => (
      <PageTypeBadge key={type} type={type} />
    ))}
  </div>
);

export const OnePageType = () => <PageTypeBadge type="checklist" />;

export const BesideSpaceAndStatus = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    <PageTypeBadge type="learning" />
    <SpaceBadge spaceId="personal" />
    <StatusBadge status="active" />
  </div>
);

export const InAPageHeader = () => (
  <PageHeader
    title="רשימת ציוד לטיול ביפן"
    titleIsUserContent
    meta={
      <>
        <PageTypeBadge type="checklist" />
        <SpaceBadge spaceId="trips" />
        <span className="text-secondary small">14 מתוך 31 סומנו</span>
      </>
    }
  />
);
