import { LabelledText, StatusBadge, BlockedBadge } from "focus-client";

/**
 * A label and the words under it are two blocks, on purpose. Written as
 * "הפעולה הבאה: Book the courtyard table for eight" the Hebrew label and the
 * English sentence share one bidirectional run, and the browser has to guess
 * which end the full stop belongs to — it guesses wrong often enough to matter.
 * The label follows the interface direction; the value gets its own
 * `dir="auto"` block and reads correctly whichever language was typed into it.
 */

export const HebrewLabelEnglishValue = () => (
  <div className="focus-card p-3">
    <LabelledText label="הפעולה הבאה">
      Book the courtyard table for eight, and confirm the vegetarian mains.
    </LabelledText>
  </div>
);

export const HebrewLabelHebrewValue = () => (
  <div className="focus-card p-3">
    <LabelledText label="הפעולה הבאה">
      להזמין את השולחן בחצר לשמונה אנשים ולאשר את המנות הצמחוניות.
    </LabelledText>
  </div>
);

export const Stacked = () => (
  <div className="focus-card p-3 d-flex flex-column gap-3">
    <p className="mb-0 fw-semibold" dir="auto">
      Painter Platform
    </p>
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <StatusBadge status="active" />
      <BlockedBadge />
    </div>
    <LabelledText label="איפה זה עומד">
      Auth and the painting list work against the API; the gallery view is half done.
    </LabelledText>
    <LabelledText label="מה חוסם">
      Uploads over 8MB fail silently — waiting on a reply from the hosting support.
    </LabelledText>
    <LabelledText label="הפעולה הבאה">
      Reproduce the upload failure with a 12MB file and capture the response body.
    </LabelledText>
  </div>
);

export const MixedContent = () => (
  <div className="focus-card p-3 d-flex flex-column gap-3">
    <LabelledText label="איפה עצרתי">
      עצרתי אחרי שבחרתי את הריצוף — נשאר להחליט על גוון הפוגה.
    </LabelledText>
    <LabelledText label="הפעולה הבאה">
      Email Sorcol about the sizing chart copy before Thursday.
    </LabelledText>
  </div>
);
