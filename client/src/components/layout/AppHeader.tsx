import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../ui/Icon";
import { DemoBadge } from "../ui/DemoBadge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { QuickSaveModal } from "../../features/save/QuickSaveModal";
import { useRelevance } from "../../features/reminders/useRelevance";

function greetingKey(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return "greeting.night";
  if (hour < 12) return "greeting.morning";
  if (hour < 18) return "greeting.afternoon";
  return "greeting.evening";
}

interface AppHeaderProps {
  /** Opens the mobile navigation drawer. */
  onOpenNav: () => void;
}

/**
 * Header, in one deliberate order: who you are, what you are looking for, what
 * you can add, and only then the switches.
 *
 * Search lives in the URL (`?q=`) so any screen can read it without shared
 * state, and a filtered view survives a refresh or a shared link. The language
 * toggle sits last and quiet: it is a setting you touch twice a year, and it
 * used to compete with the one action on the screen that does something.
 */
export function AppHeader({ onOpenNav }: AppHeaderProps) {
  const { t } = useTranslation(["common", "manage"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const urlQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(urlQuery);
  const [saving, setSaving] = useState(false);
  const { openCount } = useRelevance();

  // Keep the input in step when the query changes elsewhere (e.g. back button).
  useEffect(() => setDraft(urlQuery), [urlQuery]);

  // Quick create can ask for the save dialog by URL (`/?save=1`); the parameter
  // is consumed so a refresh does not reopen it.
  useEffect(() => {
    if (searchParams.get("save") !== "1") return;
    setSaving(true);
    const next = new URLSearchParams(searchParams);
    next.delete("save");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleChange = (value: string): void => {
    setDraft(value);

    // Searching from a detail screen should take you back to a list.
    if (
      location.pathname.startsWith("/pages/") ||
      location.pathname.startsWith("/routines/") ||
      location.pathname.startsWith("/events/")
    ) {
      navigate(value.trim() ? `/?q=${encodeURIComponent(value)}` : "/");
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (value.trim()) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <header className="focus-header">
      <div className="focus-header__row">
        <Button
          variant="light"
          className="focus-icon-button d-lg-none border"
          onClick={onOpenNav}
          aria-label={t("nav.openNavigation")}
        >
          <Icon name="menu" />
        </Button>

        <div className="focus-header__identity d-none d-xl-flex">
          <p className="focus-greeting mb-0">{t(greetingKey())}</p>
          <DemoBadge />
        </div>

        <form className="focus-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="focus-search" className="visually-hidden">
            {t("search.label")}
          </label>
          <Icon name="search" size={17} className="focus-search__icon" />
          <input
            id="focus-search"
            type="search"
            className="form-control focus-search__input"
            placeholder={t("search.placeholder")}
            value={draft}
            onChange={(event) => handleChange(event.target.value)}
            autoComplete="off"
          />
        </form>

        {/*
          The bell, with a count only when something is genuinely asking. A badge
          that always shows a number is furniture, so `openCount` counts only
          what is due today or already owed — never everything in the next month.
        */}
        <Link
          to="/reminders"
          className="focus-icon-button focus-bell btn btn-light border"
          aria-label={
            openCount > 0
              ? t("manage:reminders.badgeLabel", { count: openCount })
              : t("manage:reminders.openCentre")
          }
        >
          <Icon name="bell" size={18} />
          {openCount > 0 && (
            <span className="focus-bell__count" aria-hidden="true">
              {openCount}
            </span>
          )}
        </Link>

        <Button
          variant="primary"
          className="focus-save-button text-nowrap"
          onClick={() => setSaving(true)}
        >
          <Icon name="plus" size={16} />
          <span className="d-none d-sm-inline">{t("actions.quickSave")}</span>
        </Button>

        <LanguageSwitcher />
      </div>

      <QuickSaveModal show={saving} onClose={() => setSaving(false)} />
    </header>
  );
}
