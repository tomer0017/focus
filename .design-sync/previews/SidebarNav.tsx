import { SidebarNav } from "focus-client";

/**
 * The navigation itself, without the shell around it. It reads its entries and
 * their order from the app's own space list, and marks the active route from
 * the router — which the preview provider supplies.
 */

export const Navigation = () => (
  <aside className="focus-sidebar d-flex flex-column">
    <a href="/" className="focus-brand">
      Focus
    </a>
    <SidebarNav />
  </aside>
);

export const InsideTheDrawer = () => (
  <div className="focus-sidebar d-flex flex-column" style={{ maxInlineSize: 280 }}>
    <SidebarNav onNavigate={() => {}} />
  </div>
);
