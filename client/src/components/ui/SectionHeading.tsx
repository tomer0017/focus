import type { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  /** Optional trailing control, e.g. a "show all" link. */
  action?: ReactNode;
  id?: string;
}

/**
 * Section title only.
 *
 * The explanatory sub-line under every heading was removed: repeating "Blocked,
 * and waiting on you." under a heading that already says "Needs attention" is
 * noise, and it doubled the vertical cost of every section.
 */
export function SectionHeading({ title, action, id }: SectionHeadingProps) {
  return (
    <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
      <h2 id={id} className="focus-section-title mb-0">
        {title}
      </h2>
      {action}
    </div>
  );
}
