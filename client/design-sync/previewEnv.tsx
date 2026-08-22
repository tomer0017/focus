/**
 * The context Focus components need in order to render outside the app.
 *
 * This is not a second app shell — it is the same provider chain `App.tsx`
 * builds, in the same order, plus a router. Preview cards and every design
 * built from this library render inside it, so anything the chain leaves out
 * shows up as a blank card rather than as a subtle difference.
 *
 * `MemoryRouter` stands in for `BrowserRouter`: the cards have no history to
 * push to, and a component that renders a `<Link>` must still have a router
 * above it.
 */
import { useEffect, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import i18n, { applyDocumentLanguage, DEFAULT_LANGUAGE, type Language } from "../src/i18n";
import { PagesProvider } from "../src/state/PagesProvider";
import { RoutinesProvider } from "../src/state/RoutinesProvider";
import { EventsProvider } from "../src/state/EventsProvider";
import { VisionProvider } from "../src/state/VisionProvider";
import { ChecklistsProvider } from "../src/state/ChecklistsProvider";
import { TripsProvider } from "../src/state/TripsProvider";
import { ManageProvider } from "../src/state/ManageProvider";
import { FamilyProvider } from "../src/state/FamilyProvider";
import { LeisureProvider } from "../src/state/LeisureProvider";

export interface FocusPreviewProviderProps {
  children?: ReactNode;
  /** Hebrew (RTL) is the product default; English is the other supported one. */
  language?: Language;
  /** Route the memory router starts on, for components that read the path. */
  initialPath?: string;
}

export function FocusPreviewProvider({
  children,
  language = DEFAULT_LANGUAGE,
  initialPath = "/",
}: FocusPreviewProviderProps) {
  // Direction lives on the document element — one attribute, one layout.
  // The language itself has to move with it, or a card would read Hebrew
  // copy in a left-to-right frame.
  useEffect(() => {
    if (i18n.resolvedLanguage !== language) void i18n.changeLanguage(language);
    applyDocumentLanguage(language);
  }, [language]);

  return (
    <PagesProvider>
      <RoutinesProvider>
        <EventsProvider>
          <VisionProvider>
            <ChecklistsProvider>
              <TripsProvider>
                <ManageProvider>
                  <FamilyProvider>
                    <LeisureProvider>
                      <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
                    </LeisureProvider>
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
