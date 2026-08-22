import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Offcanvas from "react-bootstrap/Offcanvas";
import { AppHeader } from "./AppHeader";
import { SidebarNav } from "./SidebarNav";
import { useLocale } from "../../i18n/useLocale";
import { VisionDailyModal } from "../../features/vision/VisionDailyModal";

/**
 * Application frame: persistent sidebar on large screens, a drawer below `lg`.
 *
 * There is exactly one layout for both directions. The sidebar sits on the
 * inline-start edge, which the browser resolves to the left in English and the
 * right in Hebrew from `document.dir` alone.
 */
export function AppShell() {
  const { t } = useTranslation();
  const { isRtl } = useLocale();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="focus-shell">
      <aside className="focus-sidebar d-none d-lg-flex flex-column">
        <Link to="/" className="focus-brand">
          {t("brand")}
        </Link>
        <SidebarNav />
      </aside>

      {/* Mobile drawer. Placement follows direction so it opens from the same
          edge the desktop sidebar occupies. */}
      <Offcanvas
        show={navOpen}
        onHide={() => setNavOpen(false)}
        placement={isRtl ? "end" : "start"}
        aria-label={t("nav.sectionLabel")}
      >
        <Offcanvas.Header closeButton closeLabel={t("nav.closeNavigation")}>
          <Offcanvas.Title as="span" className="focus-brand focus-brand--inline">
            {t("brand")}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <SidebarNav onNavigate={() => setNavOpen(false)} />
        </Offcanvas.Body>
      </Offcanvas>

      <div className="focus-main">
        <AppHeader onOpenNav={() => setNavOpen(true)} />
        <main className="focus-content">
          {/*
            One content container across every screen. Without it, wide
            viewports left the cards hugging the sidebar edge with half the
            screen blank — the grids fill a bounded column instead.
          */}
          <div className="focus-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Once a day, only if the user asked for it. See VisionDailyModal. */}
      <VisionDailyModal />
    </div>
  );
}
