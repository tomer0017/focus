import type { ReactNode } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { PagesProvider } from "./state/PagesProvider";
import { RoutinesProvider } from "./state/RoutinesProvider";
import { EventsProvider } from "./state/EventsProvider";
import { VisionProvider } from "./state/VisionProvider";
import { ChecklistsProvider } from "./state/ChecklistsProvider";
import { TripsProvider } from "./state/TripsProvider";
import { ManageProvider } from "./state/ManageProvider";
import { FamilyProvider } from "./state/FamilyProvider";
import { LeisureProvider } from "./state/LeisureProvider";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { SpaceView } from "./features/space/SpaceView";
import { PageDetailPage } from "./features/page/PageDetailPage";
import { ProjectsBoardPage } from "./features/projects/ProjectsBoardPage";
import { TrainingPage } from "./features/training/TrainingPage";
import { RoutinePage } from "./features/routines/RoutinePage";
import { EventsPage } from "./features/events/EventsPage";
import { EventDetailPage } from "./features/events/EventDetailPage";
import { VisionBoardPage } from "./features/vision/VisionBoardPage";
import { RecipeDetailPage } from "./features/cooking/RecipeDetailPage";
import { TripsPage } from "./features/trips/TripsPage";
import { TripPage } from "./features/trips/TripPage";
import { ManagePage } from "./features/manage/ManagePage";
import { MenuDetailPage } from "./features/manage/MenuDetailPage";
import { FamilyPage } from "./features/family/FamilyPage";
import { FamilyProfilePage } from "./features/family/FamilyProfilePage";
import { LearningPage } from "./features/learning/LearningPage";
import { LeisurePage } from "./features/leisure/LeisurePage";
import { LeisureDetailPage } from "./features/leisure/LeisureDetailPage";
import { RemindersPage } from "./features/reminders/RemindersPage";
import { NotFoundPage } from "./features/page/NotFoundPage";

/**
 * One provider per domain slice, each backed by its own repository, nested
 * rather than merged so a screen only subscribes to what it reads.
 *
 * The nesting order is not arbitrary in one place: `FamilyProvider` sits
 * **inside** `ManageProvider` because deleting a profile can cascade into
 * scheduled items and medications, and it reaches them through `useManage`
 * rather than opening the same repositories a second time. Two providers
 * holding independent state over one repository would each be authoritative and
 * neither would see the other's writes.
 */
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PagesProvider>
      <RoutinesProvider>
        <EventsProvider>
          <VisionProvider>
            <ChecklistsProvider>
              <TripsProvider>
                <ManageProvider>
                  <FamilyProvider>
                    <LeisureProvider>{children}</LeisureProvider>
                  </FamilyProvider>
                </ManageProvider>
              </TripsProvider>
            </ChecklistsProvider>
          </VisionProvider>
        </EventsProvider>
      </RoutinesProvider>
    </PagesProvider>
  );
}

/**
 * `HashRouter`, not `BrowserRouter`.
 *
 * The demo is published on GitHub Pages, which serves static files and has no
 * rewrite rule: a direct request for `/focus/trips/japan-2027` is a 404 before
 * any JavaScript runs, so a deep link and a refresh on a detail screen would
 * both fail. Routing through the fragment (`/focus/#/trips/japan-2027`) keeps
 * every path the browser actually asks for pointing at `index.html`.
 *
 * Nothing else changes: every internal link already goes through `<Link>`,
 * `useSearchParams` keeps working, and direction and language are unaffected.
 */
export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsBoardPage />} />
              <Route path="training" element={<TrainingPage />} />
              <Route path="vision" element={<VisionBoardPage />} />
              <Route path="routines/:id" element={<RoutinePage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              {/* The space is part of the path, so a refresh or a shared
                  link always lands on the same screen. */}
              <Route path="spaces/:spaceId" element={<SpaceView />} />
              <Route path="recipes/:id" element={<RecipeDetailPage />} />
              <Route path="trips" element={<TripsPage />} />
              <Route path="trips/:id" element={<TripPage />} />

              {/* Ongoing management. The view is a query parameter (`?view=health`)
                  rather than a path, because it is a filter over one screen and
                  not five screens. */}
              <Route path="manage" element={<ManagePage />} />
              <Route path="manage/menus/:id" element={<MenuDetailPage />} />

              <Route path="family" element={<FamilyPage />} />
              <Route path="family/:id" element={<FamilyProfilePage />} />
              <Route path="learning" element={<LearningPage />} />
              <Route path="leisure" element={<LeisurePage />} />
              <Route path="leisure/:id" element={<LeisureDetailPage />} />
              <Route path="reminders" element={<RemindersPage />} />

              <Route path="pages/:id" element={<PageDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppProviders>
    </AppErrorBoundary>
  );
}
