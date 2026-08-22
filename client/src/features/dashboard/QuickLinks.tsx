import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/** The five screens people actually cross the overview to reach. */
const LINKS = [
  { href: "/events", key: "nav.events" },
  { href: "/projects", key: "nav.projects" },
  { href: "/learning", key: "nav.learning" },
  { href: "/manage", key: "nav.manage" },
  { href: "/trips", key: "spaces.trips" },
];

/**
 * A line of links, and nothing more.
 *
 * This is what "quick access" became. It used to be a card grid of favourite
 * pages plus a gallery of recently saved pictures, which took the bottom third
 * of the screen to answer a question nobody arrives at the overview asking. The
 * sidebar already leads everywhere; this is the same destinations within reach
 * of the thumb on a phone, where the sidebar is behind a drawer.
 */
export function QuickLinks() {
  const { t } = useTranslation(["dashboard", "common"]);

  return (
    <nav className="focus-dash-links" aria-label={t("dashboard:quickLinks")}>
      {LINKS.map((link) => (
        <Link key={link.href} to={link.href}>
          {t(`common:${link.key}`)}
        </Link>
      ))}
    </nav>
  );
}
