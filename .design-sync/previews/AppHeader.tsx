import { AppHeader } from "focus-client";

/**
 * The header strip: brand and drawer toggle, search, language, the demo badge
 * and the reminder bell. `onOpenNav` opens the mobile drawer, so in a static
 * card it is a no-op.
 */

export const Header = () => <AppHeader onOpenNav={() => {}} />;

export const InAFrame = () => (
  <div className="focus-shell">
    <div className="focus-main">
      <AppHeader onOpenNav={() => {}} />
      <main className="focus-content">
        <div className="focus-container">
          <p className="text-secondary mb-0" dir="auto">
            The header sits above the bounded content column, not across the
            whole viewport.
          </p>
        </div>
      </main>
    </div>
  </div>
);
