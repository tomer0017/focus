import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  /** One line explaining what would fill this space. */
  hint?: string;
  action?: ReactNode;
}

/**
 * Shown only when an entire screen has nothing in it.
 *
 * Individual sections must NOT render this — an empty secondary section is
 * simply not rendered at all. Six large "nothing here" panels on one screen was
 * the exact noise this refactor removed.
 */
export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="focus-empty text-center rounded-3 py-4 px-3">
      <p className="fw-semibold mb-1">{title}</p>
      {hint && <p className="text-secondary small mb-0">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
