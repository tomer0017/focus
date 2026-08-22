import {
  Routes,
  Route,
  AppShell,
  PageHeader,
  Section,
  CompactList,
  CompactRow,
  StatusBadge,
  BlockedBadge,
} from "focus-client";

/**
 * The whole frame: sidebar on the inline-start edge, header, bounded content
 * column. `AppShell` is a layout route — it renders an `<Outlet />` — so a
 * preview has to supply routes beneath it or the chrome wraps nothing.
 */

function OverviewBody() {
  return (
    <>
      <PageHeader title="סקירה" lead="מה דורש אותי עכשיו" />
      <div className="focus-sections">
        <Section title="דורש תשומת לב" hasContent span="full">
          <CompactList>
            <li>
              <CompactRow
                title="Sorcol"
                eyebrow="פרויקט"
                detail="Waiting on the models for the remaining sizes."
                badges={
                  <>
                    <StatusBadge status="active" />
                    <BlockedBadge />
                  </>
                }
                tone="due"
              />
            </li>
            <li>
              <CompactRow
                title="תאורה במטבח"
                eyebrow="פרויקט"
                detail="החשמלאי לא חוזר. צריך למצוא מישהו אחר."
                badges={<StatusBadge status="active" />}
                tone="soon"
              />
            </li>
          </CompactList>
        </Section>
      </div>
    </>
  );
}

export const WholeFrame = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<OverviewBody />} />
    </Route>
  </Routes>
);
