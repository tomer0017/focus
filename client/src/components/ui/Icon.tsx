/**
 * Local icon set: one consistent 24px stroke style, drawn inline.
 *
 * No icon library was added. The set is small and fixed, and a dependency
 * would have shipped thousands of unused glyphs plus a second visual style to
 * keep in sync. See CLAUDE.md → "No new technology without a clear need".
 */
export type IconName =
  | "overview"
  | "work"
  | "personal"
  | "home"
  | "cooking"
  | "trips"
  | "settings"
  | "menu"
  | "search"
  | "plus"
  | "close"
  | "more"
  | "edit"
  | "arrowBack"
  | "arrowForward"
  | "check"
  | "alert"
  | "clock"
  | "star"
  | "board"
  | "training"
  | "vision"
  | "calendar"
  | "link"
  | "trash"
  | "drag"
  | "chevronUp"
  | "chevronDown"
  | "gift"
  | "image"
  | "external"
  | "tag"
  | "flag"
  | "plane"
  | "bed"
  | "food"
  | "info"
  | "family"
  | "manage"
  | "leisure"
  | "learning"
  | "bell"
  | "money"
  | "pill"
  | "pet"
  | "baby"
  | "cart"
  | "snooze"
  | "stethoscope";

interface IconProps {
  name: IconName;
  /** Size in px. Defaults to 20, matching body text. */
  size?: number;
  className?: string;
  /**
   * Flip horizontally in RTL. Only for directional glyphs (arrows) — never for
   * symbols like a clock, which would read as broken when mirrored.
   */
  flipForRtl?: boolean;
}

const PATHS: Record<IconName, React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  work: (
    <>
      <rect x="2.5" y="7" width="19" height="13" rx="2" />
      <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M2.5 12h19" />
    </>
  ),
  personal: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  cooking: (
    <>
      <path d="M4 9h16a8 8 0 0 1-8 8 8 8 0 0 1-8-8Z" />
      <path d="M3 20h18" />
      <path d="M9 6c0-1 1-1.4 1-2.5M13 6c0-1 1-1.4 1-2.5" />
    </>
  ),
  trips: (
    <>
      <path d="M2.5 19h19" />
      <path d="M4 19l6-9 4 5 2.5-3 3.5 7" />
      <circle cx="17" cy="6" r="2.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </>
  ),
  menu: <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8 20.5 20.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  more: (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M15.5 6.5 17.5 8.5" />
    </>
  ),
  // Both arrows are drawn for LTR and mirrored in RTL via `flipForRtl`, so
  // "back" always points at the start edge and "forward" at the end edge.
  arrowBack: <path d="M20 12H4M10 6l-6 6 6 6" />,
  arrowForward: <path d="M4 12h16M14 6l6 6-6 6" />,
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  alert: (
    <>
      <path d="M12 4.5 21 19.5H3L12 4.5Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  star: (
    <path d="m12 4 2.4 5 5.6.7-4 3.8 1 5.5-5-2.7-5 2.7 1-5.5-4-3.8 5.6-.7L12 4Z" />
  ),
  board: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.5" />
      <rect x="16" y="4" width="5" height="7" rx="1.5" />
    </>
  ),
  training: (
    <>
      <path d="M4 9v6M20 9v6" />
      <rect x="6" y="6.5" width="3.5" height="11" rx="1.5" />
      <rect x="14.5" y="6.5" width="3.5" height="11" rx="1.5" />
      <path d="M9.5 12h5" />
    </>
  ),
  vision: (
    <>
      <rect x="3" y="4" width="8" height="8" rx="1.5" />
      <rect x="13" y="4" width="8" height="5" rx="1.5" />
      <rect x="3" y="14" width="8" height="6" rx="1.5" />
      <rect x="13" y="11" width="8" height="9" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.2 1.2" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.2-1.2" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
      <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
    </>
  ),
  drag: (
    <>
      <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  chevronUp: <path d="M6 15l6-6 6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11.5" rx="2" />
      <path d="M3.5 13.5h17M12 9v11.5" />
      <path d="M12 9C9.5 9 7.5 8 7.5 6.2A2.2 2.2 0 0 1 12 5.6 2.2 2.2 0 0 1 16.5 6.2C16.5 8 14.5 9 12 9Z" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4.5 17.5 9.8 12.6a1.6 1.6 0 0 1 2.2 0l5.2 4.9" />
    </>
  ),
  // Never mirrored: the arrow means "leaves this site", not "goes forward".
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11.5 12.5" />
      <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 11.2V4.8A1.3 1.3 0 0 1 4.8 3.5h6.4a1.3 1.3 0 0 1 .9.4l8 8a1.3 1.3 0 0 1 0 1.8l-6.4 6.4a1.3 1.3 0 0 1-1.8 0l-8-8a1.3 1.3 0 0 1-.4-.9Z" />
      <circle cx="7.8" cy="7.8" r="1.3" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 5h11l-2 3.5L16 12H5" />
    </>
  ),
  plane: <path d="M10.5 20.5l1.6-5.4 3.9-1.2 4.4 3.1a1 1 0 0 0 1.5-1.1L19.5 4.6a1.4 1.4 0 0 0-2.5-.5L9.6 13 4 12.1a1 1 0 0 0-.7 1.8l4.4 2.8-1 3.4a.8.8 0 0 0 1.3.8Z" />,
  bed: (
    <>
      <path d="M3 19v-9M3 13h18a2 2 0 0 1 2 2v4" />
      <circle cx="8" cy="10" r="2" />
      <path d="M12 13V9.5A1.5 1.5 0 0 1 13.5 8h5" />
    </>
  ),
  food: (
    <>
      <path d="M6 3v8a2 2 0 0 0 4 0V3" />
      <path d="M8 11v10" />
      <path d="M17 3c-1.7 1.3-2.5 3-2.5 5s.8 3.2 2.5 3.5V21" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6v.6" />
    </>
  ),
  family: (
    <>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.3" />
      <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h2A4.5 4.5 0 0 1 14 18.5V20" />
      <path d="M15.5 14h1A4.5 4.5 0 0 1 21 18.5V20" />
    </>
  ),
  manage: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 13.5h3" />
      <path d="M8 16.5h6" />
    </>
  ),
  leisure: (
    <>
      <path d="M4 6.5h16v11H4z" />
      <path d="M8 6.5V4.5" />
      <path d="M16 6.5V4.5" />
      <path d="M10.5 10.5v3l3-1.5z" />
    </>
  ),
  learning: (
    <>
      <path d="M3 7.5 12 4l9 3.5-9 3.5z" />
      <path d="M6.5 10v5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5" />
      <path d="M21 7.5V13" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </>
  ),
  money: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 10v4" />
      <path d="M18 10v4" />
    </>
  ),
  pill: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-40 12 12)" />
      <path d="M9.2 9.2 14.8 14.8" />
    </>
  ),
  pet: (
    <>
      <ellipse cx="12" cy="16" rx="3.6" ry="3" />
      <ellipse cx="6.3" cy="11" rx="1.8" ry="2.3" />
      <ellipse cx="17.7" cy="11" rx="1.8" ry="2.3" />
      <ellipse cx="9.6" cy="6.8" rx="1.7" ry="2.2" />
      <ellipse cx="14.4" cy="6.8" rx="1.7" ry="2.2" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M10 8.5h.01M14 8.5h.01" />
      <path d="M10.4 11.2c.9.7 2.3.7 3.2 0" />
      <path d="M6.5 20v-.8A3.2 3.2 0 0 1 9.7 16h4.6a3.2 3.2 0 0 1 3.2 3.2V20" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h7.7a1.6 1.6 0 0 0 1.6-1.3L20 7.5H6" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="16.5" cy="19" r="1.3" />
    </>
  ),
  snooze: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.6" />
      <path d="M9.5 2.5h5" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" />
      <path d="M6 3H4.5M14 3h1.5" />
      <path d="M10 12v2.5a4.5 4.5 0 0 0 9 0V12" />
      <circle cx="19" cy="10.2" r="1.9" />
    </>
  ),
};

export function Icon({ name, size = 20, className, flipForRtl = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`${flipForRtl ? "focus-icon-directional" : ""} ${className ?? ""}`.trim()}
    >
      {PATHS[name]}
    </svg>
  );
}
