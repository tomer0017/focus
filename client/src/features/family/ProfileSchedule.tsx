import { useMemo, useState } from "react";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { CompactList, CompactRow } from "../../components/ui/CompactRow";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { PagedList } from "../../components/ui/PagedList";
import { ShowMore } from "../../components/ui/ShowMore";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay, formatShortDate } from "../../lib/format";
import { belongsTo, familyReference, logsFor, medicationsFor } from "../../lib/familySelectors";
import { byDueDate, isOpen } from "../../lib/scheduled";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import type { FamilyProfile, QuickLogKind, ScheduledItem } from "../../types";
import { MedicationFormModal } from "../manage/MedicationFormModal";
import { ScheduledFormModal } from "../manage/ScheduledFormModal";
import { ScheduledRow } from "../manage/ScheduledRow";
import { ProfileTasks } from "./ProfileTasks";
import { QuickLogModal } from "./QuickLogModal";

/** The kinds of quick log a baby or a pet actually accumulates. */
const LOG_KINDS: QuickLogKind[] = ["feeding", "tasting", "treatment", "other"];

/** How many recent logs sit in the compact strip before "show history". */
const RECENT_LOGS = 5;

interface ProfileScheduleProps {
  profile: FamilyProfile;
  /** The profile's edit mode, passed through to the shared checklist. */
  isEditing: boolean;
}

/**
 * Everything that happens to this person or animal over time.
 *
 * One tab rather than five sections. Appointments, treatments, check-ups,
 * vaccinations, visits and plain reminders were separate panels switched on
 * one by one, and they are all the same thing: a `ScheduledItem` with a date
 * and a category. Splitting them meant a grandmother's page had four headings
 * with one row each.
 *
 * Medicines sit here too, and are **not** copied into scheduled items: a
 * `Medication` already carries its own times and is shown as itself.
 *
 * Nothing here is medical advice. Every value is what the user typed, repeated
 * back unchanged.
 */
export function ProfileSchedule({ profile, isEditing }: ProfileScheduleProps) {
  const { t } = useTranslation(["family", "manage", "common"]);
  const { locale } = useLocale();
  const { logs } = useFamily();
  const { scheduled, medications } = useManage();

  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledItem | undefined>(undefined);
  const [addingMedication, setAddingMedication] = useState(false);
  const [loggingKind, setLoggingKind] = useState<QuickLogKind | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const owner = useMemo(() => familyReference(profile.id), [profile.id]);

  /*
   * Every association here is the explicit `relatedEntity` reference the item
   * was saved with — `belongsTo` compares references, never names or id
   * prefixes. An item nobody assigned to a profile appears on none.
   */
  const open = useMemo(
    () => belongsTo(scheduled, profile.id).filter(isOpen).sort(byDueDate),
    [scheduled, profile.id]
  );
  const closed = useMemo(
    () => belongsTo(scheduled, profile.id).filter((item) => !isOpen(item)).sort(byDueDate),
    [scheduled, profile.id]
  );
  const myMedications = useMemo(
    () => medicationsFor(medications, profile.id),
    [medications, profile.id]
  );
  const myLogs = useMemo(() => logsFor(logs, profile.id), [logs, profile.id]);

  /* Quick logs are for the profiles that actually accumulate them. */
  const tracksLogs = profile.type === "baby" || profile.type === "pet";

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} /> {t("family:schedule.add")}
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={() => setAddingMedication(true)}>
          {t("family:schedule.addMedication")}
        </Button>
        {tracksLogs &&
          LOG_KINDS.map((kind) => (
            <Button
              key={kind}
              variant="outline-secondary"
              size="sm"
              onClick={() => setLoggingKind(kind)}
            >
              {t(`family:logKinds.${kind}`)}
            </Button>
          ))}
      </div>

      {open.length === 0 && myMedications.length === 0 && myLogs.length === 0 ? (
        <p className="focus-dash-empty">{t("family:schedule.empty")}</p>
      ) : (
        <>
          {open.length > 0 && (
            <PagedList items={open} pageSize={20} resetKey={profile.id}>
              {(shown) => (
                <CompactList>
                  {shown.map((item) => (
                    <ScheduledRow key={item.id} item={item} onEdit={setEditingItem} />
                  ))}
                </CompactList>
              )}
            </PagedList>
          )}

          {myMedications.length > 0 && (
            <section className="mt-4">
              <h3 className="focus-section-title">{t("family:schedule.medications")}</h3>
              <CompactList>
                {myMedications.map((medication) => (
                  <li key={medication.id}>
                    <CompactRow
                      title={medication.name}
                      detail={medication.dosage}
                      meta={
                        medication.times.length > 0 ? (
                          <span>{medication.times.join(" · ")}</span>
                        ) : undefined
                      }
                    />
                  </li>
                ))}
              </CompactList>
              {/* Said once, here, and nowhere else on the page. */}
              <div className="mt-2">
                <InfoNote tone="caution">{t("family:safety.medical")}</InfoNote>
              </div>
            </section>
          )}

          {myLogs.length > 0 && (
            <section className="mt-4">
              <div className="focus-dash-area__head">
                <h3 className="focus-section-title mb-0">{t("family:schedule.recentLogs")}</h3>
                <button
                  type="button"
                  className="btn btn-sm btn-link p-0 text-decoration-none"
                  onClick={() => setShowHistory((current) => !current)}
                >
                  {showHistory ? t("family:schedule.hideHistory") : t("family:schedule.showHistory")}
                </button>
              </div>

              {showHistory ? (
                <PagedList items={myLogs} pageSize={20} resetKey={`${profile.id}-logs`}>
                  {(shown) => <LogList entries={shown} locale={locale} />}
                </PagedList>
              ) : (
                <LogList entries={myLogs.slice(0, RECENT_LOGS)} locale={locale} />
              )}
            </section>
          )}

          {closed.length > 0 && (
            <section className="mt-4">
              <h3 className="focus-section-title">{t("family:schedule.done")}</h3>
              <ShowMore items={closed} limit={3}>
                {(shown) => (
                  <CompactList>
                    {shown.map((item) => (
                      <ScheduledRow key={item.id} item={item} onEdit={setEditingItem} />
                    ))}
                  </CompactList>
                )}
              </ShowMore>
            </section>
          )}
        </>
      )}

      {/*
        Tasks sit last and quietest. A profile is mostly about what is coming;
        the shopping list for a grandparent matters and does not outrank the
        appointment on Thursday.
      */}
      <ProfileTasks profileId={profile.id} isEditing={isEditing} />

      <ScheduledFormModal
        show={adding || Boolean(editingItem)}
        item={editingItem}
        defaultRelated={owner}
        onClose={() => {
          setAdding(false);
          setEditingItem(undefined);
        }}
      />

      <MedicationFormModal
        show={addingMedication}
        defaultRelated={owner}
        onClose={() => setAddingMedication(false)}
      />

      {loggingKind && (
        <QuickLogModal
          show
          kind={loggingKind}
          owner={owner}
          onClose={() => setLoggingKind(null)}
        />
      )}
    </>
  );
}

/** Quick logs, newest first. Whatever the user typed, repeated back. */
function LogList({
  entries,
  locale,
}: {
  entries: ReturnType<typeof logsFor>;
  locale: string;
}) {
  const { t } = useTranslation(["family"]);

  return (
    <CompactList>
      {entries.map((entry) => (
        <li key={entry.id}>
          <CompactRow
            title={entry.title ?? t(`family:logKinds.${entry.kind}`)}
            eyebrow={t(`family:logKinds.${entry.kind}`)}
            detail={entry.note}
            meta={
              <>
                {entry.value !== undefined && (
                  <span dir="auto">
                    {entry.value}
                    {entry.unit ? ` ${entry.unit}` : ""}
                  </span>
                )}
                <time dateTime={entry.occurredAt}>{formatShortDate(entry.occurredAt, locale)}</time>
                <span>{formatRelativeDay(entry.occurredAt, locale)}</span>
              </>
            }
          />
        </li>
      ))}
    </CompactList>
  );
}
