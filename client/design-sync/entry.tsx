/**
 * The Focus component library, as one entry point.
 *
 * Focus is an application, not a published package, so this file is the
 * library surface it never needed for itself: the shared mechanisms — the
 * primitives in `components/ui`, the app shell in `components/layout`, and
 * the composition pieces in `features/sections` — gathered so they can be
 * bundled and typed as a design system.
 *
 * It is a re-export list and nothing else. Nothing is redefined here, so a
 * component behaves in a design exactly as it behaves in the app.
 */

/*
 * Routing primitives, re-exported from the bundle deliberately.
 *
 * A preview or a design that imports `react-router-dom` directly gets a
 * SECOND copy of react-router, whose context the router inside
 * `FocusPreviewProvider` cannot see — `<Routes>` then renders nothing at all.
 * Re-exporting them here means everyone shares one router.
 */
export { Routes, Route, Outlet, Link, NavLink } from "react-router-dom";

// ── the environment every Focus component renders inside ────────────────
export { FocusPreviewProvider } from "./previewEnv";
export type { FocusPreviewProviderProps } from "./previewEnv";

// ── primitives ───────────────────────────────────────────────────────────
export { Avatar } from "../src/components/ui/Avatar";
export { BackButton } from "../src/components/ui/BackButton";
export {
  SpaceBadge,
  PageTypeBadge,
  StatusBadge,
  BlockedBadge,
  RoutineDomainBadge,
  EventKindBadge,
} from "../src/components/ui/Badges";
export { BoardImage } from "../src/components/ui/BoardImage";
export { Checklist } from "../src/components/ui/Checklist";
export { CompactRow, CompactList } from "../src/components/ui/CompactRow";
export { ConfirmDialog } from "../src/components/ui/ConfirmDialog";
export { DemoBadge } from "../src/components/ui/DemoBadge";
export { DemoBadgeInline } from "../src/components/ui/DemoBadgeInline";
export { EditButton } from "../src/components/ui/EditButton";
export { EmptyState } from "../src/components/ui/EmptyState";
export { ErrorState } from "../src/components/ui/ErrorState";
export { ExternalLink } from "../src/components/ui/ExternalLink";
export { FilterChips } from "../src/components/ui/FilterChips";
export { Icon } from "../src/components/ui/Icon";
export { InfoNote } from "../src/components/ui/InfoNote";
export { LabelledText } from "../src/components/ui/LabelledText";
export { LoadingState } from "../src/components/ui/LoadingState";
export { MonthlyCompletionCalendar } from "../src/components/ui/MonthlyCompletionCalendar";
export { PageHeader } from "../src/components/ui/PageHeader";
export { ProgressBar } from "../src/components/ui/ProgressBar";
export { RecurrenceField } from "../src/components/ui/RecurrenceField";
export { RelatedLinks } from "../src/components/ui/RelatedLinks";
export { SavedItemCard } from "../src/components/ui/SavedItemCard";
export { SectionHeading } from "../src/components/ui/SectionHeading";
export { ShowMore } from "../src/components/ui/ShowMore";
export { StatRow } from "../src/components/ui/StatRow";
export { TemplatePicker } from "../src/components/ui/TemplatePicker";
export { TokenListField } from "../src/components/ui/TokenListField";
export { UrlImageField } from "../src/components/ui/UrlImageField";
export { WeekdayField } from "../src/components/ui/WeekdayField";

// ── the shell ────────────────────────────────────────────────────────────
export { AppShell } from "../src/components/layout/AppShell";
export { AppHeader } from "../src/components/layout/AppHeader";
export { SidebarNav } from "../src/components/layout/SidebarNav";
export { LanguageSwitcher } from "../src/components/layout/LanguageSwitcher";

// ── section composition ──────────────────────────────────────────────────
export { Section } from "../src/features/sections/Section";
export { AttentionList } from "../src/features/sections/AttentionList";
export { ContinueList } from "../src/features/sections/ContinueList";
export { EventList } from "../src/features/sections/EventList";
export { RoutineList } from "../src/features/sections/RoutineList";
export { PageChipList } from "../src/features/sections/PageChipList";
export { SavedItemsRow } from "../src/features/sections/SavedItemsRow";
export { UpcomingStrip } from "../src/features/sections/UpcomingStrip";
export { CollectionEntryRow } from "../src/features/sections/CollectionEntryRow";

/* -- trips -------------------------------------------------------------- */
/*
 * The trips vocabulary. These five are the pieces the redesign added, and they
 * are the ones worth reusing elsewhere: a row for a thing with a date and a
 * countdown, the band that gives a screen its identity, and the segmented
 * control that lets one panel stand in for six stacked sections.
 */
export { TripRow } from "../src/features/trips/TripRow";
export { FeaturedTrip } from "../src/features/trips/FeaturedTrip";
export { TripHero } from "../src/features/trips/TripHero";
export { SegmentedNav } from "../src/components/ui/SegmentedNav";
export { DayRail } from "../src/features/trips/DayRail";

/* -- the shared collection language ------------------------------------- */
/*
 * Added in the system-wide pass. `SegmentedNav` moved out of `features/trips/`
 * and is now the app's primary tab strip; the rest are the pieces every
 * collection screen is built from.
 */
export { CollectionPage } from "../src/components/ui/CollectionPage";
export { PagedList } from "../src/components/ui/PagedList";
export { OverflowMenu } from "../src/components/ui/OverflowMenu";
export { SearchField } from "../src/components/ui/SearchField";
export { Thumbnail } from "../src/components/ui/Thumbnail";
export { RouteStrip } from "../src/features/trips/RouteStrip";
