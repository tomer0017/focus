import { useId, type ReactNode } from "react";
import { SectionHeading } from "../../components/ui/SectionHeading";
import type { SectionSpan } from "./sectionSpan";

interface SectionProps {
  title: string;
  /** Nothing renders when this is false — the core anti-noise rule. */
  hasContent: boolean;
  action?: ReactNode;
  /**
   * How much of a `.focus-sections` grid this section takes.
   *
   * `"auto"` lets a short section share a row with another short one, which is
   * what stopped Home, Trips, Training and Events from rendering one lonely
   * card per full-width row with most of the screen blank. `"full"` is for
   * sections that genuinely have a row's worth of content.
   */
  span?: SectionSpan;
  children: ReactNode;
}

/**
 * Wrapper for every dashboard and space-view section.
 *
 * An empty secondary section renders NOTHING — no heading, no "nothing here"
 * panel, no reserved space. A whole-screen empty state is handled one level up,
 * by the view itself.
 */
export function Section({ title, hasContent, action, span = "full", children }: SectionProps) {
  const headingId = useId();

  if (!hasContent) return null;

  return (
    <section
      aria-labelledby={headingId}
      className={`focus-section focus-section--${span}`}
    >
      <SectionHeading id={headingId} title={title} action={action} />
      {children}
    </section>
  );
}
