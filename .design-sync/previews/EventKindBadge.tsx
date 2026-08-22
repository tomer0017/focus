import { EventKindBadge, SpaceBadge, PageHeader } from "focus-client";
import type { EventKind } from "../../client/src/types";

/**
 * What sort of occasion this is. The kind seeds a starting set of sections and
 * then stops mattering — which is why it stays a single primary chip and never
 * grows a colour per kind.
 */

const KINDS: EventKind[] = [
  "birthday",
  "holiday",
  "wedding",
  "barMitzvah",
  "batMitzvah",
  "anniversary",
  "party",
  "hosting",
  "family",
  "custom",
];

export const AllKinds = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    {KINDS.map((kind) => (
      <EventKindBadge key={kind} kind={kind} />
    ))}
  </div>
);

export const OneKind = () => <EventKindBadge kind="wedding" />;

export const InAnEventHeader = () => (
  <PageHeader
    title="יום הולדת 60 לאמא"
    titleIsUserContent
    meta={
      <>
        <EventKindBadge kind="birthday" />
        <SpaceBadge spaceId="personal" />
        <span className="text-secondary small">12 ביוני 2024, 19:00</span>
      </>
    }
  />
);

export const OnAnEventCard = () => (
  <div className="focus-card p-3">
    <p className="mb-1 fw-semibold" dir="auto">
      ארוחת ערב לחברים מהצבא
    </p>
    <p className="mb-2 small text-secondary" dir="auto">
      שמונה אנשים, אחד צמחוני
    </p>
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <EventKindBadge kind="hosting" />
      <SpaceBadge spaceId="cooking" />
    </div>
  </div>
);
