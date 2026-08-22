import { StatusBadge, BlockedBadge } from "focus-client";

/**
 * Three statuses and only three. Blocked is not a fourth — it is a separate
 * fact that sits beside a status, which is why the pair is shown together
 * rather than as one four-value sweep.
 */

export const AllStatuses = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    <StatusBadge status="active" />
    <StatusBadge status="paused" />
    <StatusBadge status="completed" />
  </div>
);

export const ActiveAndBlocked = () => (
  <div className="d-flex flex-wrap gap-2 align-items-center">
    <StatusBadge status="active" />
    <BlockedBadge />
  </div>
);

export const InContext = () => (
  <div className="focus-card p-3">
    <p className="mb-2 fw-semibold" dir="auto">
      Sorcol
    </p>
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <StatusBadge status="active" />
      <BlockedBadge />
    </div>
  </div>
);
