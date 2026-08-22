import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { ShowMore } from "../../components/ui/ShowMore";
import { StatRow } from "../../components/ui/StatRow";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey, formatMonthKey, formatMoney, formatSignedMoney } from "../../lib/format";
import { entriesInMonth, monthKey, summariseMonth } from "../../lib/money";
import { useManage } from "../../state/manageContext";
import type { MoneyEntry } from "../../types";
import { MoneyFormModal } from "./MoneyFormModal";

/** Shift a `YYYY-MM` key by whole months. */
function shiftMonth(key: string, by: number): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1 + by, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const LIMIT = 8;

/**
 * One month of income and expenses.
 *
 * Four numbers and a list. Not a budget: there is no target to be under, no
 * category breakdown and no comparison with last month, because none of those
 * change what somebody does next. "You have not marked the electricity bill
 * paid" does.
 */
export function MoneyPanel() {
  const { t } = useTranslation(["manage", "common"]);
  const { locale } = useLocale();
  const { money, setPaid, deleteMoneyEntry } = useManage();

  const [month, setMonth] = useState(() => monthKey());
  const [editing, setEditing] = useState<MoneyEntry | undefined>(undefined);
  const [creating, setCreating] = useState<MoneyEntry["direction"] | undefined>(undefined);
  const [confirming, setConfirming] = useState<MoneyEntry | undefined>(undefined);

  const summary = useMemo(() => summariseMonth(money, month), [money, month]);
  const rows = useMemo(() => entriesInMonth(money, month), [money, month]);

  return (
    <div className="focus-panel">
      <div className="focus-toolbar mb-2">
        <h3 className="focus-panel__title mb-0 focus-toolbar__grow">{t("manage:money.title")}</h3>
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="focus-icon-button btn btn-sm btn-link text-secondary"
            aria-label={t("manage:money.previousMonth")}
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
          >
            <Icon name="arrowBack" size={16} flipForRtl />
          </button>
          <span className="small fw-semibold">{formatMonthKey(month, locale)}</span>
          <button
            type="button"
            className="focus-icon-button btn btn-sm btn-link text-secondary"
            aria-label={t("manage:money.nextMonth")}
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
          >
            <Icon name="arrowForward" size={16} flipForRtl />
          </button>
        </div>
      </div>

      <StatRow
        stats={[
          { label: t("manage:money.summaryIn"), value: formatMoney(summary.income, locale) },
          { label: t("manage:money.summaryOut"), value: formatMoney(summary.expenses, locale) },
          {
            label: t("manage:money.summaryBalance"),
            value: formatSignedMoney(summary.balance, locale),
          },
          {
            label: t("manage:money.summaryUnpaid"),
            value: formatMoney(summary.unpaid, locale),
            muted: summary.unpaid === 0,
          },
        ]}
      />

      <div className="d-flex flex-wrap gap-2 my-2">
        <Button variant="outline-secondary" size="sm" onClick={() => setCreating("income")}>
          {t("manage:money.addIncome")}
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={() => setCreating("expense")}>
          {t("manage:money.addExpense")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="focus-panel__lead mb-0">{t("manage:money.empty")}</p>
      ) : (
        <ShowMore items={rows} limit={LIMIT}>
          {(visible) => (
            <CompactList>
              {visible.map((entry) => (
                <li key={entry.id}>
                  <CompactRow
                    title={entry.category ?? entry.note ?? ""}
                    eyebrow={t(`manage:money.${entry.direction}`)}
                    detail={entry.category ? entry.note : undefined}
                    tone={entry.direction === "expense" && !entry.paid ? "soon" : "neutral"}
                    badges={
                      entry.direction === "expense" && !entry.paid ? (
                        <span className="focus-chip focus-chip--warning">
                          {t("manage:money.notPaid")}
                        </span>
                      ) : undefined
                    }
                    meta={
                      <>
                        <span className="fw-semibold">
                          {entry.direction === "income"
                            ? formatSignedMoney(entry.amount, locale, entry.currency)
                            : formatSignedMoney(-entry.amount, locale, entry.currency)}
                        </span>
                        <time dateTime={entry.occurredOn}>
                          {formatDayKey(entry.occurredOn, locale)}
                        </time>
                      </>
                    }
                    actions={
                      <>
                        {entry.direction === "expense" && (
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none"
                            onClick={() => setPaid(entry.id, !entry.paid)}
                          >
                            {entry.paid ? t("manage:money.markUnpaid") : t("manage:money.markPaid")}
                          </button>
                        )}
                        <button
                          type="button"
                          className="focus-icon-button btn btn-sm btn-link text-secondary"
                          aria-label={t("common:actions.editNamed", {
                            name: entry.category ?? entry.note ?? "",
                          })}
                          onClick={() => setEditing(entry)}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          className="focus-icon-button btn btn-sm btn-link text-secondary"
                          aria-label={t("common:actions.deleteNamed", {
                            name: entry.category ?? entry.note ?? "",
                          })}
                          onClick={() => setConfirming(entry)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </>
                    }
                  />
                </li>
              ))}
            </CompactList>
          )}
        </ShowMore>
      )}

      <div className="mt-2">
        <InfoNote>{t("manage:money.noBank")}</InfoNote>
      </div>

      <MoneyFormModal
        show={Boolean(editing) || Boolean(creating)}
        entry={editing}
        defaultDirection={creating}
        defaultMonth={month}
        onClose={() => {
          setEditing(undefined);
          setCreating(undefined);
        }}
      />

      <ConfirmDialog
        show={Boolean(confirming)}
        title={t("manage:money.deleteTitle")}
        body={t("manage:money.deleteBody", { month: formatMonthKey(month, locale) })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          if (confirming) deleteMoneyEntry(confirming.id);
          setConfirming(undefined);
        }}
        onCancel={() => setConfirming(undefined)}
      />
    </div>
  );
}
