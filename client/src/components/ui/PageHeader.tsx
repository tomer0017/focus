import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** True when the title is user content and must follow its own direction. */
  titleIsUserContent?: boolean;
  /** One line under the title. Interface copy. */
  lead?: string;
  /** Badges, dates, status — sits above the title. */
  meta?: ReactNode;
  /** The screen's primary action. Sits beside the title, not across the row. */
  action?: ReactNode;
  /** Back button or breadcrumb, above everything. */
  before?: ReactNode;
}

/**
 * The one header every screen uses.
 *
 * The action sits **next to** the title, not merely on the same row. Pushing it
 * to the far edge of a 1200px container with `space-between` is technically the
 * same line and visually two unrelated things: at that distance nobody reads
 * "New event" as belonging to "Events". It wraps under the title when the pair
 * no longer fits.
 */
export function PageHeader({
  title,
  titleIsUserContent,
  lead,
  meta,
  action,
  before,
}: PageHeaderProps) {
  return (
    <header className="focus-page-header">
      {before && <div className="focus-page-header__before">{before}</div>}
      {meta && <div className="focus-detail__meta">{meta}</div>}

      <div className="focus-page-header__row">
        <h1 className="focus-page-title mb-0" dir={titleIsUserContent ? "auto" : undefined}>
          {title}
        </h1>
        {action && <div className="focus-page-header__action">{action}</div>}
      </div>

      {lead && <p className="focus-page-lead">{lead}</p>}
    </header>
  );
}
