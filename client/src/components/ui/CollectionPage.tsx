import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { SegmentedNav, type SegmentedItem } from "./SegmentedNav";

interface CollectionPageProps {
  title: string;
  /** One line under the title. Interface copy. */
  lead?: string;
  /** The one primary action — "new project", "new trip". */
  action?: ReactNode;
  /** Above the tabs: the single thing that needs attention, when there is one. */
  feature?: ReactNode;
  /** Primary tabs — a category or a view. Omitted when there is only one. */
  tabs?: SegmentedItem[];
  tabValue?: string;
  onTabChange?: (id: string) => void;
  /** Accessible name for the tab strip. */
  tabsLabel?: string;
  /** Secondary status filter and search, on one line under the tabs. */
  toolbar?: ReactNode;
  children: ReactNode;
}

/**
 * The shape every collection screen in Focus takes.
 *
 * Title and one action, then at most two layers of narrowing — a primary tab
 * for *which kind*, and a secondary filter for *which state* — then one list.
 * Before this existed, each domain invented its own arrangement: projects were
 * three vertical columns, manage was six stacked panels, learning was an
 * unframed list, and the same project could appear on four screens looking
 * different on each.
 *
 * Two layers is the cap. A third would mean a screen where the user has to
 * remember three separate choices to know what they are looking at.
 *
 * The component owns no state: which tab is active belongs to the screen, which
 * usually keeps it in the URL so a refresh lands in the same place.
 */
export function CollectionPage({
  title,
  lead,
  action,
  feature,
  tabs,
  tabValue,
  onTabChange,
  tabsLabel,
  toolbar,
  children,
}: CollectionPageProps) {
  return (
    <div className="focus-collection">
      <PageHeader title={title} lead={lead} action={action} />

      {feature}

      {/* A tab strip with one tab is not a choice. */}
      {tabs && tabs.length > 1 && tabValue !== undefined && onTabChange && (
        <SegmentedNav
          label={tabsLabel ?? title}
          items={tabs}
          value={tabValue}
          onChange={onTabChange}
          variant="tabs"
          collapse
        />
      )}

      {toolbar && <div className="focus-collection__toolbar">{toolbar}</div>}

      <div className="focus-collection__body">{children}</div>
    </div>
  );
}
