import { ProgressBar } from "focus-client";

/**
 * The one progress readout in the app. It is deliberately small — the numbers
 * are written out as well as drawn, so the bar is never the only way to know
 * how far along something is.
 *
 * `label` is the accessible name and never appears on screen, so the sweep
 * below writes its own captions: without them four bars in a column are four
 * anonymous stripes.
 */

export const PackingProgress = () => (
  <div className="focus-checklist-page__progress">
    <ProgressBar done={14} total={23} label="התקדמות ברשימת האריזה ליפן" />
  </div>
);

/**
 * The whole range in one cell. 0% and 100% are the two ends worth checking:
 * an empty bar must still read as a bar, and a full one must not overflow its
 * track.
 */
export const Sweep = () => (
  <div className="d-grid gap-3" style={{ maxInlineSize: 520 }}>
    <div>
      <p className="form-text mb-1" dir="auto">
        קנייה שבועית
      </p>
      <ProgressBar done={0} total={18} label="התקדמות בקנייה השבועית" />
    </div>
    <div>
      <p className="form-text mb-1" dir="auto">
        רשימת אריזה — יפן
      </p>
      <ProgressBar done={5} total={23} label="התקדמות ברשימת האריזה ליפן" />
    </div>
    <div>
      <p className="form-text mb-1" dir="auto">
        משימות לבר מצווה
      </p>
      <ProgressBar done={14} total={23} label="התקדמות במשימות לבר מצווה" />
    </div>
    <div>
      <p className="form-text mb-1" dir="auto">
        Sorcol — trial sizes
      </p>
      <ProgressBar done={7} total={8} label="התקדמות במידות הניסיון" />
    </div>
    <div>
      <p className="form-text mb-1" dir="auto">
        קניות לשבת
      </p>
      <ProgressBar done={12} total={12} label="התקדמות בקניות לשבת" />
    </div>
  </div>
);

/**
 * A list with nothing in it yet. `completionFraction` has to survive a zero
 * denominator, because a checklist page renders before anything is added.
 */
export const EmptyList = () => (
  <div className="focus-checklist-page__progress">
    <ProgressBar done={0} total={0} label="התקדמות ברשימה חדשה" />
  </div>
);

/** Inside a panel, which is where every real one lives. */
export const InPanel = () => (
  <div className="focus-card p-3" style={{ maxInlineSize: 420 }}>
    <p className="mb-2 fw-semibold" dir="auto">
      קניות לשבת
    </p>
    <ProgressBar done={9} total={12} label="התקדמות בקניות לשבת" />
  </div>
);
