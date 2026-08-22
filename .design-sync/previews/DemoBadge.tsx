import { DemoBadge } from "focus-client";

/**
 * The one place Focus admits it is running on demo data held in this browser.
 * It sits once in the header, next to the brand — it replaced a full-width
 * banner that cost a row of vertical space on every screen to say something
 * true of the whole app.
 */

export const Badge = () => <DemoBadge />;

export const BesideTheBrand = () => (
  <div className="d-flex align-items-center gap-2">
    <span className="fw-bold">Focus</span>
    <DemoBadge />
  </div>
);

export const InAHeaderStrip = () => (
  <div className="focus-header">
    <div className="focus-header__row">
      <div className="focus-header__identity">
        <p className="focus-greeting mb-0">Focus</p>
        <DemoBadge />
      </div>
    </div>
  </div>
);
