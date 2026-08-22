import { ExternalLink } from "focus-client";

/**
 * The only way Focus sends anybody to another site.
 *
 * It is a judge as much as a link: anything that is not a real `http(s)`
 * destination — a relative path, an unknown scheme, a documentation host — is
 * rendered as plain text instead, so a broken link can never be dressed up as a
 * working one. What it does render always opens in a new tab, carries the
 * external icon, and says "opens in a new tab" to a screen reader.
 */

export const Standalone = () => (
  <ExternalLink href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values">
    <span dir="auto">CSS logical properties — MDN</span>
  </ExternalLink>
);

/** Inside a sentence of user content, which is where most of them sit. */
export const InlineInText = () => (
  <p className="mb-0" dir="auto">
    המתכון המקורי נמצא כאן:{" "}
    <ExternalLink href="https://ottolenghi.co.uk/">
      <span dir="auto">Ottolenghi</span>
    </ExternalLink>{" "}
    — שיניתי רק את כמות הלימון.
  </p>
);

/** `stretched` when the whole surrounding card is the click target. */
export const StretchedInCard = () => (
  <div className="focus-card p-3 position-relative">
    <div className="d-flex flex-wrap gap-2 mb-2">
      <span className="focus-chip focus-chip--muted">מוצר</span>
      <span className="focus-chip focus-chip--muted">חנות</span>
    </div>
    <h3 className="h6 mb-1" dir="auto">
      <ExternalLink href="https://www.ikea.com/il/he/" stretched>
        מזנון אלון 180 ס״מ
      </ExternalLink>
    </h3>
    <p className="text-secondary small mb-0" dir="auto">
      נכנס בול מתחת לחלון. לבדוק אם יש בגוון בהיר יותר.
    </p>
  </div>
);

/**
 * Handed something that is not an external destination — here an in-app path —
 * it renders the children as plain text and no link at all.
 */
export const RefusesANonDestination = () => (
  <div className="d-flex flex-column gap-2">
    <ExternalLink href="/pages/sorcol">
      <span dir="auto">Sorcol — an in-app path, not an external one</span>
    </ExternalLink>
    <p className="text-secondary small mb-0" dir="auto">
      (No icon, no new tab, no link — the text stands on its own.)
    </p>
  </div>
);
