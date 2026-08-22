import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { CompactList } from "../../components/ui/CompactRow";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { PagedList } from "../../components/ui/PagedList";
import { dueItems, isOpen, upcomingItems } from "../../lib/scheduled";
import { monthKey, unpaidEntries, upcomingCharges } from "../../lib/money";
import { useManage } from "../../state/manageContext";
import { useLocale } from "../../i18n/useLocale";
import { formatMoney, formatShortDate } from "../../lib/format";
import type { ScheduledItem } from "../../types";
import { CommitmentsPanel } from "./CommitmentsPanel";
import { HealthPanel } from "./HealthPanel";
import { MoneyPanel } from "./MoneyPanel";
import { QuickCreateModal } from "./QuickCreateModal";
import { ScheduledFormModal } from "./ScheduledFormModal";
import { ScheduledRow } from "./ScheduledRow";
import { ShoppingPanel } from "./ShoppingPanel";

/**
 * The areas of ongoing management.
 *
 * `overview` answers "what needs me today" and nothing else; the rest are the
 * five kinds of paperwork, each on its own.
 */
type ManageView = "overview" | "reminders" | "money" | "commitments" | "health" | "shopping";

const VIEWS: ManageView[] = [
  "overview",
  "reminders",
  "money",
  "commitments",
  "health",
  "shopping",
];

/**
 * Older links used `?view=all` and `?view=dates`. Both still work: a stored
 * bookmark and a link from the overview must not 404 into a blank screen
 * because the tabs were renamed.
 */
const LEGACY_VIEWS: Record<string, ManageView> = {
  all: "overview",
  dates: "reminders",
};

/** Beyond this, an important date is not important *yet*. */
const DATES_HORIZON_DAYS = 60;

/**
 * Ongoing management — one area in the navigation, six views inside it.
 *
 * Insurance, subscriptions, medicines, bills and shopping are five separate
 * top-level entries in most apps, and that sprawl is what this screen exists to
 * avoid. But the landing view used to render *every* panel stacked, which came
 * to 2,700px of scrolling — the same mistake in the other direction: one screen
 * asking five unrelated questions at once.
 *
 * Now each kind of paperwork is a tab, and the landing view is a short triage:
 * what is due today, what is about to be charged, what is unpaid. Nothing on it
 * is a full list; every row leads to the tab that owns it.
 *
 * The view lives in the URL (`?view=health`), so a refresh, a back button and a
 * link from the overview all land on the same screen.
 */
export function ManagePage() {
  const { t } = useTranslation(["manage", "common"]);
  const { locale } = useLocale();
  const { scheduled, commitments, money } = useManage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ScheduledItem | undefined>(undefined);
  const [editingOpen, setEditingOpen] = useState(false);

  const raw = searchParams.get("view") ?? "";
  const view: ManageView = VIEWS.includes(raw as ManageView)
    ? (raw as ManageView)
    : (LEGACY_VIEWS[raw] ?? "overview");

  const setView = (next: ManageView): void => {
    const params = new URLSearchParams(searchParams);
    if (next === "overview") {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    setSearchParams(params, { replace: true });
  };

  /*
   * "Reminders" is not every open item: it is what falls inside the next two
   * months, plus everything with no date at all. An annual renewal in November
   * is a fact about November, and it turns up here when November is close.
   */
  const reminders = useMemo(
    () =>
      upcomingItems(scheduled, DATES_HORIZON_DAYS).concat(
        scheduled.filter((item) => isOpen(item) && !item.dueAt)
      ),
    [scheduled]
  );

  /* ---- the triage the landing view is built from ---- */

  const due = useMemo(() => dueItems(scheduled).slice(0, 3), [scheduled]);
  const charges = useMemo(() => upcomingCharges(commitments, new Date(), 14).slice(0, 3), [commitments]);
  /* This month's unpaid expenses only: an invoice from March is history. */
  const thisMonth = monthKey();
  const unpaid = useMemo(
    () =>
      unpaidEntries(money)
        .filter((entry) => entry.occurredOn.startsWith(thisMonth))
        .slice(0, 3),
    [money, thisMonth]
  );

  const tabs = VIEWS.map((value) => ({
    id: value,
    label: t(`manage:views.${value}`),
    badge:
      value === "reminders" && reminders.length > 0
        ? String(reminders.length)
        : value === "overview" && due.length > 0
          ? String(due.length)
          : undefined,
  }));

  const openEditor = (item?: ScheduledItem): void => {
    setEditing(item);
    setEditingOpen(true);
  };

  const band = (title: string, goTo: ManageView, body: React.ReactNode) => (
    <section className="focus-band">
      <div className="focus-band__head">
        <h2 className="focus-band__title">{title}</h2>
        <button
          type="button"
          className="focus-band__action focus-chip-button"
          onClick={() => setView(goTo)}
        >
          {t("manage:openArea")}
        </button>
      </div>
      {body}
    </section>
  );

  const nothingToday =
    due.length === 0 && charges.length === 0 && unpaid.length === 0;

  return (
    <>
      <CollectionPage
        title={t("manage:title")}
        lead={t("manage:lead")}
        action={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="plus" size={14} /> {t("manage:add")}
          </Button>
        }
        tabs={tabs}
        tabValue={view}
        onTabChange={(id) => setView(id as ManageView)}
        tabsLabel={t("manage:viewLabel")}
      >
        {view === "overview" && (
          <>
            {/* A quiet screen is a real answer, and the one people hope for. */}
            {nothingToday && <p className="focus-day-empty mb-0">{t("manage:overview.clear")}</p>}

            {due.length > 0 &&
              band(
                t("manage:overview.dueToday"),
                "reminders",
                <CompactList>
                  {due.map((item) => (
                    <ScheduledRow key={item.id} item={item} onEdit={openEditor} />
                  ))}
                </CompactList>
              )}

            {charges.length > 0 &&
              band(
                t("manage:overview.upcomingCharges"),
                "commitments",
                <ul className="list-unstyled focus-trip-open mb-0">
                  {charges.map((charge) => (
                    <li key={charge.commitment.id} dir="auto">
                      <Icon name="money" size={12} />
                      {charge.commitment.title}
                      <span className="focus-trip-open__note">
                        {formatShortDate(charge.at, locale)}
                        {charge.commitment.amount !== undefined &&
                          ` · ${formatMoney(charge.commitment.amount, locale, charge.commitment.currency)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

            {unpaid.length > 0 &&
              band(
                t("manage:overview.unpaid"),
                "money",
                <ul className="list-unstyled focus-trip-open mb-0">
                  {unpaid.map((entry) => (
                    <li key={entry.id} dir="auto">
                      <Icon name="alert" size={12} />
                      {entry.category ?? entry.note ?? t("manage:overview.expense")}
                      <span className="focus-trip-open__note">
                        {formatMoney(entry.amount, locale, entry.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
          </>
        )}

        {view === "reminders" && (
          <>
            <div className="focus-bookings__bar">
              <Button variant="outline-primary" size="sm" onClick={() => openEditor()}>
                <Icon name="plus" size={13} />
                {t("manage:scheduled.add")}
              </Button>
            </div>
            {reminders.length === 0 ? (
              <p className="focus-day-empty mb-0">{t("manage:overview.clear")}</p>
            ) : (
              <PagedList items={reminders} pageSize={20} resetKey="reminders">
                {(visible) => (
                  <CompactList>
                    {visible.map((item) => (
                      <ScheduledRow key={item.id} item={item} onEdit={openEditor} />
                    ))}
                  </CompactList>
                )}
              </PagedList>
            )}
          </>
        )}

        {view === "money" && <MoneyPanel />}
        {view === "commitments" && <CommitmentsPanel />}
        {view === "health" && <HealthPanel />}
        {view === "shopping" && <ShoppingPanel />}

        {/* The disclaimer belongs where the claim is made, once. */}
        {(view === "money" || view === "health" || view === "commitments") && (
          <div className="mt-4">
            <InfoNote>{t("manage:privacy.body")}</InfoNote>
          </div>
        )}
      </CollectionPage>

      <QuickCreateModal show={creating} onClose={() => setCreating(false)} />

      <ScheduledFormModal
        show={editingOpen}
        item={editing}
        onClose={() => {
          setEditingOpen(false);
          setEditing(undefined);
        }}
      />
    </>
  );
}
