import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface CompactRowProps {
  /** User content. Always rendered `dir="auto"`. */
  title: string;
  /** Interface copy above the title — a category, a source, a kind. */
  eyebrow?: string;
  /** One line of user content under the title, clamped to a single line. */
  detail?: string;
  /** Right-hand facts: a date, an amount, a countdown. Interface copy. */
  meta?: ReactNode;
  /** Badges and chips, beside the title. */
  badges?: ReactNode;
  /** Buttons. Secondary ones fade in on hover and focus; all stay tab-reachable. */
  actions?: ReactNode;
  /** A small picture or avatar at the start of the row. */
  leading?: ReactNode;
  /**
   * Ticked / total, drawn as a short bar after the meta.
   *
   * A number *and* a bar, never a bar alone — and it only appears when there is
   * something to count. A row with no list attached reserves no space for one,
   * which is what stops a list of rows growing a permanently empty column.
   */
  progress?: { done: number; total: number };
  /** Makes the whole row a link to this address. */
  href?: string;
  /** Accent stripe on the inline-start edge, for urgency. Never the only signal. */
  tone?: "neutral" | "due" | "soon" | "done";
}

/**
 * The dense row.
 *
 * This exists because a card was the wrong shape for most of what Focus now
 * holds. A subscription is a name, a price and a date — three facts that fit on
 * one line — and wrapping them in a bordered box with 24px of padding produced
 * a screen where six items filled a laptop display and most of it was white.
 *
 * Rules the row enforces so no caller has to remember them:
 *
 * - **No minimum height.** A row is as tall as its contents, full stop.
 * - **Details are clamped to one line.** A list view is for finding the thing,
 *   not for reading it; the detail screen is one tap away.
 * - **Secondary actions are quiet, not hidden.** They fade in on hover *and* on
 *   keyboard focus, and they remain in the tab order and in the accessibility
 *   tree at all times — a touch device has no hover, so anything only reachable
 *   that way would be unreachable. Below `md` they are simply always visible.
 * - **Tone is an accent, never the message.** The stripe reinforces a label
 *   that is always written out somewhere in the row.
 */
export function CompactRow({
  title,
  eyebrow,
  detail,
  meta,
  badges,
  actions,
  leading,
  progress,
  href,
  tone = "neutral",
}: CompactRowProps) {
  const body = (
    <>
      {eyebrow && <p className="focus-dense-row__eyebrow">{eyebrow}</p>}
      <p className="focus-dense-row__title" dir="auto">
        {href ? (
          <Link to={href} className="stretched-link focus-dense-row__link">
            {title}
          </Link>
        ) : (
          title
        )}
      </p>
      {detail && (
        <p className="focus-dense-row__detail focus-clamp-1" dir="auto">
          {detail}
        </p>
      )}
    </>
  );

  return (
    <div className={`focus-dense-row focus-dense-row--${tone}`}>
      {leading && <div className="focus-dense-row__leading">{leading}</div>}

      <div className="focus-dense-row__body">{body}</div>

      {badges && <div className="focus-dense-row__badges">{badges}</div>}

      {progress && progress.total > 0 && (
        <div className="focus-dense-row__progress">
          <span className="focus-dense-row__progress-text">
            {progress.done}/{progress.total}
          </span>
          <span className="focus-mini-bar" aria-hidden="true">
            <span style={{ inlineSize: `${Math.round((progress.done / progress.total) * 100)}%` }} />
          </span>
        </div>
      )}

      {meta && <div className="focus-dense-row__meta">{meta}</div>}
      {/* Sits above the stretched link so its buttons stay clickable. */}
      {actions && <div className="focus-dense-row__actions">{actions}</div>}
    </div>
  );
}

/** A list of compact rows. `<ul>` so assistive tech announces the count. */
export function CompactList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={`focus-dense-rows list-unstyled mb-0${className ? " " + className : ""}`}>{children}</ul>;
}
