import { SpaceBadge, StatusBadge, BlockedBadge, PageTypeBadge, PageHeader } from "focus-client";
import type { SpaceId } from "../../client/src/types";

/**
 * A space is the area of life a page belongs to. The five are a closed union,
 * and each carries its own accent — which is why the sweep is worth showing as
 * one strip: the colours only mean anything next to each other.
 */

const SPACE_IDS: SpaceId[] = ["work-tech", "personal", "home", "cooking", "trips"];

export const AllSpaces = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    {SPACE_IDS.map((id) => (
      <SpaceBadge key={id} spaceId={id} />
    ))}
  </div>
);

export const OneSpace = () => <SpaceBadge spaceId="work-tech" />;

export const OnABoardCard = () => (
  <div className="focus-card p-3">
    <p className="mb-2 fw-semibold" dir="auto">
      Painter Platform
    </p>
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <SpaceBadge spaceId="work-tech" />
      <BlockedBadge />
    </div>
    <p className="mb-0 mt-2 small text-secondary" dir="auto">
      Uploads fail over 8MB — need to check what the API actually accepts.
    </p>
  </div>
);

export const InAPageHeader = () => (
  <PageHeader
    title="שיפוץ המטבח"
    titleIsUserContent
    meta={
      <>
        <PageTypeBadge type="project" />
        <SpaceBadge spaceId="home" />
        <StatusBadge status="active" />
        <span className="text-secondary small">עודכן לפני יומיים</span>
      </>
    }
  />
);
