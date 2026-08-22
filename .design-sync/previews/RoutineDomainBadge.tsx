import { RoutineDomainBadge, SpaceBadge, PageHeader } from "focus-client";
import type { RoutineDomain } from "../../client/src/types";

/**
 * What kind of recurring thing this is. Six domains, deliberately coarse — a
 * routine is filed by the part of life it belongs to, not by a taxonomy, so
 * "other" is a real answer and not a gap.
 */

const DOMAINS: RoutineDomain[] = [
  "training",
  "health",
  "home",
  "vehicle",
  "personal",
  "other",
];

export const AllDomains = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    {DOMAINS.map((domain) => (
      <RoutineDomainBadge key={domain} domain={domain} />
    ))}
  </div>
);

export const OneDomain = () => <RoutineDomainBadge domain="training" />;

export const InARoutineHeader = () => (
  <PageHeader
    title="אימון כוח"
    titleIsUserContent
    meta={
      <>
        <RoutineDomainBadge domain="training" />
        <SpaceBadge spaceId="personal" />
        <span className="focus-chip focus-chip--muted">שלוש פעמים בשבוע</span>
        <span className="text-secondary small">בוצע לאחרונה אתמול</span>
      </>
    }
  />
);

export const InAListRow = () => (
  <div className="focus-card p-3">
    <p className="mb-2 fw-semibold" dir="auto">
      טיפול 10,000 ק״מ לרכב
    </p>
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <RoutineDomainBadge domain="vehicle" />
      <SpaceBadge spaceId="home" />
    </div>
  </div>
);
