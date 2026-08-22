import type { CSSProperties } from "react";
import { Icon, CompactList, CompactRow } from "focus-client";
import Button from "react-bootstrap/Button";

/**
 * The whole icon set, drawn inline — no icon library was added, so what is
 * here is what exists. Every glyph is one 24px viewBox at stroke width 1.7,
 * inherits `currentColor`, and is `aria-hidden`: an icon never carries the
 * meaning on its own, so the label beside it is always the accessible name.
 *
 * The gallery below is the full `IconName` union, all 47 of them, so a name
 * that is not on it is not in the set.
 */

const ALL_ICONS = [
  "overview",
  "work",
  "personal",
  "home",
  "cooking",
  "trips",
  "settings",
  "menu",
  "search",
  "plus",
  "edit",
  "arrowBack",
  "arrowForward",
  "check",
  "alert",
  "clock",
  "star",
  "board",
  "training",
  "vision",
  "calendar",
  "link",
  "trash",
  "drag",
  "chevronUp",
  "chevronDown",
  "gift",
  "image",
  "external",
  "tag",
  "flag",
  "plane",
  "bed",
  "food",
  "info",
  "family",
  "manage",
  "leisure",
  "learning",
  "bell",
  "money",
  "pill",
  "pet",
  "baby",
  "cart",
  "snooze",
  "stethoscope",
] as const;

const nameStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: "0.66rem",
  lineHeight: 1.3,
  color: "var(--focus-muted)",
  wordBreak: "break-word",
};

const tileStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  padding: "10px 4px",
  border: "1px solid var(--focus-line)",
  borderRadius: "var(--focus-radius-sm)",
  background: "var(--focus-surface)",
  color: "var(--focus-text)",
  textAlign: "center",
};

/** Every glyph in the set, with the name to pass to `name`. */
export const AllIcons = () => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
      gap: "8px",
    }}
  >
    {ALL_ICONS.map((name) => (
      <div key={name} style={tileStyle}>
        <Icon name={name} size={22} />
        <span style={nameStyle} dir="ltr">
          {name}
        </span>
      </div>
    ))}
  </div>
);

/**
 * `size` defaults to 20, which matches body text. 15–16 is what sits inside a
 * small button, 18 leads a dense row, and anything above 28 is decorative.
 */
export const Sizes = () => (
  <div className="d-flex flex-wrap align-items-end gap-4">
    {[14, 16, 18, 20, 24, 32, 48].map((size) => (
      <div key={size} className="d-flex flex-column align-items-center gap-2">
        <Icon name="calendar" size={size} />
        <span style={nameStyle} dir="ltr">
          {size === 20 ? "20 (default)" : String(size)}
        </span>
      </div>
    ))}
  </div>
);

/**
 * `flipForRtl` mirrors the glyph in a right-to-left frame, and it is only ever
 * right for an arrow that means a *direction*. A clock mirrored reads as
 * broken, and the external-link arrow means "leaves this site", not "forward" —
 * neither is flipped. The frame here is Hebrew, so the flip is live.
 */
export const DirectionalAndNot = () => (
  <div className="d-flex flex-wrap gap-4">
    <div className="d-flex flex-column align-items-center gap-2" style={{ width: "120px" }}>
      <Icon name="arrowBack" size={28} flipForRtl />
      <span style={nameStyle} dir="ltr">
        arrowBack + flipForRtl
      </span>
      <span className="focus-chip focus-chip--success">מתהפך</span>
    </div>
    <div className="d-flex flex-column align-items-center gap-2" style={{ width: "120px" }}>
      <Icon name="arrowForward" size={28} flipForRtl />
      <span style={nameStyle} dir="ltr">
        arrowForward + flipForRtl
      </span>
      <span className="focus-chip focus-chip--success">מתהפך</span>
    </div>
    <div className="d-flex flex-column align-items-center gap-2" style={{ width: "120px" }}>
      <Icon name="clock" size={28} />
      <span style={nameStyle} dir="ltr">
        clock
      </span>
      <span className="focus-chip focus-chip--muted">לא מתהפך</span>
    </div>
    <div className="d-flex flex-column align-items-center gap-2" style={{ width: "120px" }}>
      <Icon name="external" size={28} />
      <span style={nameStyle} dir="ltr">
        external
      </span>
      <span className="focus-chip focus-chip--muted">לא מתהפך</span>
    </div>
  </div>
);

/** Where the glyphs actually land: leading a dense row, inside a chip, inside a button. */
export const InSitu = () => (
  <div className="d-flex flex-column gap-3">
    <div className="d-flex flex-wrap align-items-center gap-2">
      <Button variant="primary" size="sm">
        <Icon name="plus" size={16} /> תור חדש
      </Button>
      <Button variant="outline-primary" size="sm">
        <Icon name="edit" size={15} /> עריכה
      </Button>
      <Button variant="light" size="sm" className="border">
        <Icon name="snooze" size={16} /> דחייה
      </Button>
      <span className="focus-chip focus-chip--warning">
        <Icon name="alert" size={14} /> חסום
      </span>
      <span className="focus-chip focus-chip--muted">
        <Icon name="clock" size={14} /> פעם בחודש
      </span>
    </div>

    <CompactList>
      <li>
        <CompactRow
          title="ביטוח דירה"
          eyebrow="חידוש"
          detail="הראל — נשלחה הצעה חלופית מהסוכן"
          leading={<Icon name="money" size={18} />}
          meta={<span>1 בספטמבר</span>}
          tone="soon"
        />
      </li>
      <li>
        <CompactRow
          title="חיסון משולש ללונה"
          eyebrow="וטרינר"
          detail="ד״ר שקד, לקחת את הפנקס"
          leading={<Icon name="pet" size={18} />}
          meta={<span>בעוד 9 ימים</span>}
        />
      </li>
      <li>
        <CompactRow
          title="ויטמין D"
          eyebrow="תרופה"
          detail="פעם בשבוע, בבוקר"
          leading={<Icon name="pill" size={18} />}
          meta={<span>היום</span>}
          tone="due"
        />
      </li>
      <li>
        <CompactRow
          title="יפן 2027"
          eyebrow="טיול"
          detail="טוקיו, קיוטו, קנזאווה — 14 יום"
          leading={<Icon name="plane" size={18} />}
          meta={<span>באפריל</span>}
        />
      </li>
    </CompactList>
  </div>
);
