import { useState } from "react";
import { useTranslation } from "react-i18next";
import Dropdown from "react-bootstrap/Dropdown";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { Icon } from "../../components/ui/Icon";
import { ShowMore } from "../../components/ui/ShowMore";
import { StatRow } from "../../components/ui/StatRow";
import { useLocale } from "../../i18n/useLocale";
import { daysUntil, formatMoney, formatRelativeDay } from "../../lib/format";
import { commitmentTotals } from "../../lib/money";
import { useManage } from "../../state/manageContext";
import type { Commitment, CommitmentKind } from "../../types";
import { CommitmentFormModal } from "./CommitmentFormModal";

/** How many rows before "show more". Six fills a panel without filling a screen. */
const LIMIT = 6;

/**
 * Insurance and subscriptions, as two lists over one model.
 *
 * The three numbers above them are the only summary this screen gets: roughly
 * per month, roughly per year, how many are running. No chart — a pie of five
 * subscriptions tells you less than the five numbers do, and takes six times
 * the space.
 */
export function CommitmentsPanel() {
  const { t } = useTranslation(["manage", "common"]);
  const { locale } = useLocale();
  const { commitments, markCharged, deleteCommitment } = useManage();
  const [editing, setEditing] = useState<Commitment | undefined>(undefined);
  const [creating, setCreating] = useState<CommitmentKind | undefined>(undefined);
  const [confirming, setConfirming] = useState<Commitment | undefined>(undefined);

  const totals = commitmentTotals(commitments);

  const listFor = (kind: CommitmentKind): Commitment[] =>
    commitments
      .filter((entry) => entry.kind === kind)
      .sort((a, b) => {
        // Cancelled ones drop to the bottom: they cost nothing and are kept
        // only as a record of what was stopped.
        if ((a.status === "cancelled") !== (b.status === "cancelled")) {
          return a.status === "cancelled" ? 1 : -1;
        }
        return (a.nextChargeAt ?? "9999").localeCompare(b.nextChargeAt ?? "9999");
      });

  const renderRow = (entry: Commitment) => {
    const nextAt = entry.nextChargeAt ?? entry.renewalAt;
    const daysAway = nextAt ? daysUntil(nextAt) : undefined;
    const soon = daysAway !== undefined && daysAway >= 0 && daysAway <= (entry.remindDaysBefore ?? 7);

    return (
      <li key={entry.id}>
        <CompactRow
          title={entry.title}
          eyebrow={entry.provider}
          detail={entry.note}
          tone={entry.status === "cancelled" ? "neutral" : soon ? "soon" : "neutral"}
          badges={
            <>
              <span className="focus-chip focus-chip--muted">
                {t(`manage:cycles.${entry.cycle}`)}
              </span>
              {entry.status === "cancelled" && (
                <span className="focus-chip focus-chip--muted">
                  {t("manage:commitments.cancelled")}
                </span>
              )}
            </>
          }
          meta={
            <>
              {entry.amount !== undefined && (
                <span className="fw-semibold">
                  {formatMoney(entry.amount, locale, entry.currency)}
                </span>
              )}
              {nextAt && (
                <time dateTime={nextAt} className={soon ? "focus-due-soon" : undefined}>
                  {t(
                    entry.nextChargeAt ? "manage:commitments.chargedIn" : "manage:commitments.renewsIn",
                    { when: formatRelativeDay(nextAt, locale) }
                  )}
                </time>
              )}
            </>
          }
          actions={
            <Dropdown align="end">
              <Dropdown.Toggle
                as="button"
                type="button"
                className="focus-icon-button btn btn-sm btn-link text-secondary"
                aria-label={t("common:actions.editNamed", { name: entry.title })}
              >
                <Icon name="edit" size={16} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item as="button" type="button" onClick={() => setEditing(entry)}>
                  {t("common:actions.edit")}
                </Dropdown.Item>
                {entry.nextChargeAt && entry.cycle !== "oneOff" && (
                  <Dropdown.Item as="button" type="button" onClick={() => markCharged(entry.id)}>
                    {t("manage:commitments.markCharged")}
                  </Dropdown.Item>
                )}
                <Dropdown.Item as="button" type="button" onClick={() => setConfirming(entry)}>
                  {t("common:actions.delete")}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          }
        />
        {entry.manageUrl && (
          <p className="focus-dense-row__detail mb-2">
            <ExternalLink href={entry.manageUrl}>
              {t("manage:commitments.manageUrl")}
            </ExternalLink>
          </p>
        )}
      </li>
    );
  };

  const section = (kind: CommitmentKind, titleKey: string, addKey: string) => {
    const rows = listFor(kind);
    return (
      <div className="focus-panel">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
          <h3 className="focus-panel__title mb-0">{t(titleKey)}</h3>
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0"
            onClick={() => setCreating(kind)}
          >
            {t(addKey)}
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="focus-panel__lead mb-0">{t("manage:commitments.empty")}</p>
        ) : (
          <ShowMore items={rows} limit={LIMIT}>
            {(visible) => <CompactList>{visible.map(renderRow)}</CompactList>}
          </ShowMore>
        )}
      </div>
    );
  };

  return (
    <>
      <StatRow
        stats={[
          {
            label: t("manage:commitments.totalMonthly"),
            value: formatMoney(Math.round(totals.monthly), locale),
          },
          {
            label: t("manage:commitments.totalYearly"),
            value: formatMoney(Math.round(totals.yearly), locale),
          },
          {
            label: t("manage:commitments.activeCount"),
            value: String(totals.activeCount),
            muted: true,
          },
        ]}
      />

      <div className="focus-panel-grid mt-2">
        {section("insurance", "manage:commitments.insurance", "manage:commitments.addInsurance")}
        {section(
          "subscription",
          "manage:commitments.subscription",
          "manage:commitments.addSubscription"
        )}
      </div>

      <CommitmentFormModal
        show={Boolean(editing) || Boolean(creating)}
        commitment={editing}
        defaultKind={creating}
        onClose={() => {
          setEditing(undefined);
          setCreating(undefined);
        }}
      />

      <ConfirmDialog
        show={Boolean(confirming)}
        title={t("manage:commitments.deleteTitle")}
        body={t("manage:commitments.deleteBody", { title: confirming?.title ?? "" })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          if (confirming) deleteCommitment(confirming.id);
          setConfirming(undefined);
        }}
        onCancel={() => setConfirming(undefined)}
      />
    </>
  );
}
