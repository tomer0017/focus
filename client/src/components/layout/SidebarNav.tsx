import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SPACES } from "../../mocks/spaces";
import { Icon, type IconName } from "../ui/Icon";

interface SidebarNavProps {
  /** Called after a navigation, so the mobile drawer can close itself. */
  onNavigate?: () => void;
}

/**
 * The screens that are not a space: the work surfaces, pinned above them.
 *
 * Ongoing management, Family, Learning and Leisure are **one entry each**. The
 * alternative — separate entries for insurance, subscriptions, medicines,
 * shopping, films and books — is the menu sprawl this app exists to avoid: each
 * of those is a view inside an area, reachable by a filter rather than by a
 * ninth line in the sidebar.
 *
 * Reminders is not here. It lives on the header bell, because it is a thing you
 * glance at when it has a number on it, not a place you navigate to.
 */
const PINNED: { href: string; icon: IconName; labelKey: string }[] = [
  { href: "/", icon: "overview", labelKey: "nav.overview" },
  { href: "/manage", icon: "manage", labelKey: "nav.manage" },
  { href: "/family", icon: "family", labelKey: "nav.family" },
  { href: "/projects", icon: "board", labelKey: "nav.projects" },
  { href: "/learning", icon: "learning", labelKey: "nav.learning" },
  { href: "/training", icon: "training", labelKey: "nav.training" },
  { href: "/events", icon: "calendar", labelKey: "nav.events" },
  { href: "/leisure", icon: "leisure", labelKey: "nav.leisure" },
  { href: "/vision", icon: "vision", labelKey: "nav.visionBoard" },
];

/**
 * Navigation content, shared by the desktop column and the mobile drawer.
 *
 * The URL is the source of truth for which screen is shown, so active state is
 * derived from the pathname and survives a refresh. <NavLink> is not used: its
 * matching is prefix-based and would light up Overview on every route.
 */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const renderLink = (href: string, icon: IconName, label: string) => {
    const isActive = pathname === href;
    return (
      <li key={href}>
        <Link
          to={href}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={`focus-nav-link ${isActive ? "is-active" : ""}`}
        >
          <Icon name={icon} size={18} />
          <span>{label}</span>
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={t("nav.sectionLabel")} className="d-flex flex-column h-100">
      <p className="focus-nav-group">{t("nav.workspaceLabel")}</p>
      <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
        {PINNED.map((entry) => renderLink(entry.href, entry.icon, t(entry.labelKey)))}
      </ul>

      <hr className="my-2 opacity-25" />

      <p className="focus-nav-group">{t("nav.sectionLabel")}</p>
      <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
        {SPACES.map((space) =>
          renderLink(`/spaces/${space.id}`, space.icon, t(`spaces.${space.id}`))
        )}
      </ul>

      <div className="mt-auto pt-3">
        {/*
          Settings is a deliberate placeholder: there is nothing to configure
          until accounts exist. Disabled rather than a dead link.
        */}
        <button type="button" className="focus-nav-link w-100 border-0 bg-transparent" disabled>
          <Icon name="settings" size={18} />
          <span>{t("nav.settings")}</span>
        </button>
      </div>
    </nav>
  );
}
