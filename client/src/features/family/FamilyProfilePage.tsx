import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { Avatar } from "../../components/ui/Avatar";
import { BackButton } from "../../components/ui/BackButton";
import { CompactList } from "../../components/ui/CompactRow";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { PageHeader } from "../../components/ui/PageHeader";
import { RelatedLinks } from "../../components/ui/RelatedLinks";
import { ShowMore } from "../../components/ui/ShowMore";
import { ChecklistSection } from "../checklist/ChecklistSection";
import { ProjectNotes } from "../page/ProjectNotes";
import { ScheduledFormModal } from "../manage/ScheduledFormModal";
import { ScheduledRow } from "../manage/ScheduledRow";
import { MedicationFormModal } from "../manage/MedicationFormModal";
import { useLocale } from "../../i18n/useLocale";
import { formatClockTime, formatDayKey, formatRelativeDay } from "../../lib/format";
import { ageAtNextBirthday, birthdayEventFor } from "../../lib/birthdays";
import {
  FAMILY_TOPIC_KEY,
  belongsTo,
  familyReference,
  familyTopicOf,
  logsFor,
  sectionsOf,
  type FamilyTopic,
} from "../../lib/familySelectors";
import { SegmentedNav } from "../../components/ui/SegmentedNav";
import { byDueDate, isOpen } from "../../lib/scheduled";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import { usePages } from "../../state/pagesContext";
import type { FamilySectionKind, ScheduledItem } from "../../types";
import { FeedingSection } from "./FeedingSection";
import { ProfileFormModal } from "./ProfileFormModal";
import { SectionManager } from "./SectionManager";
import { TastingSection } from "./TastingSection";

/** Categories each scheduled section shows. One list, sliced four ways. */
const SECTION_CATEGORIES: Partial<Record<FamilySectionKind, ScheduledItem["category"][]>> = {
  reminders: ["reminder", "contact", "treatment", "renewal", "shopping", "bill", "date"],
  health: ["appointment"],
  checkups: ["checkup"],
  vaccinations: ["vaccination"],
  shopping: ["shopping"],
};

/**
 * One profile.
 *
 * Everything on this page is a section the user switched on. Nothing empty is
 * rendered — not a heading, not a placeholder, not a reserved band for a photo
 * that was never added. A brand-new profile is a name, a relationship and two
 * or three short sections, and that is the point: ten empty headings is the
 * noise Focus exists to remove.
 *
 * View mode keeps the one-tap facts live — logging a feed, ticking a dose,
 * marking a visit done — because recording something that just happened is not
 * editing. Renaming, reordering and deleting live behind the edit action.
 */
export function FamilyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["family", "manage", "common", "pages"]);
  const { locale } = useLocale();
  const navigate = useNavigate();

  const { getProfile, logs, setProfileNotes, deleteProfile } = useFamily();
  const { scheduled, medications } = useManage();
  const { savedItems } = usePages();

  const [editing, setEditing] = useState(false);
  const [topic, setTopic] = useState<FamilyTopic | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [addingScheduled, setAddingScheduled] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledItem | undefined>(undefined);
  const [addingMedication, setAddingMedication] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [cascade, setCascade] = useState(false);

  const profile = id ? getProfile(id) : undefined;

  const owner = useMemo(() => familyReference(id ?? ""), [id]);
  const mine = useMemo(
    () => (profile ? belongsTo(scheduled, profile.id).filter(isOpen).sort(byDueDate) : []),
    [scheduled, profile]
  );
  const myMedications = useMemo(
    () => (profile ? belongsTo(medications, profile.id) : []),
    [medications, profile]
  );
  const myDocuments = useMemo(
    () => (profile ? savedItems.filter((item) => profile.savedItemIds.includes(item.id)) : []),
    [savedItems, profile]
  );

  if (!profile) {
    return (
      <EmptyState
        title={t("common:errors.pageNotFoundTitle")}
        hint={t("common:errors.pageNotFoundMessage", { id: id ?? "" })}
      />
    );
  }

  const birthday = birthdayEventFor(profile);
  const turning = profile.birthDate ? ageAtNextBirthday(profile.birthDate) : undefined;
  /* Every record that points here — the number the delete dialog states. */
  const relatedCount =
    belongsTo(scheduled, profile.id).length +
    myMedications.length +
    logsFor(logs, profile.id).length;

  const panel = (title: string, body: React.ReactNode, action?: React.ReactNode) => (
    <section className="focus-panel">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
        <h2 className="focus-panel__title mb-0">{title}</h2>
        {action}
      </div>
      {body}
    </section>
  );

  const scheduledPanel = (kind: FamilySectionKind, title: string) => {
    const categories = SECTION_CATEGORIES[kind];
    if (!categories) return null;
    const items = mine.filter((item) => categories.includes(item.category));
    // The rule the whole app follows: an empty section renders nothing at all.
    if (items.length === 0 && !editing) return null;

    return panel(
      title,
      items.length === 0 ? (
        <p className="focus-panel__lead mb-0">{t("manage:scheduled.empty")}</p>
      ) : (
        <ShowMore items={items} limit={5}>
          {(visible) => (
            <CompactList>
              {visible.map((item) => (
                <ScheduledRow key={item.id} item={item} onEdit={setEditingScheduled} />
              ))}
            </CompactList>
          )}
        </ShowMore>
      ),
      <button
        type="button"
        className="btn btn-sm btn-link text-decoration-none p-0"
        onClick={() => setAddingScheduled(true)}
      >
        {t("manage:scheduled.add")}
      </button>
    );
  };

  const renderSection = (kind: FamilySectionKind, title: string) => {
    switch (kind) {
      case "dates": {
        if (!birthday) return null;
        return panel(
          title,
          <p className="mb-0">
            <time dateTime={birthday.startsAt} className="fw-semibold">
              {formatDayKey(birthday.startsAt.slice(0, 10), locale)}
            </time>
            {" · "}
            {formatRelativeDay(birthday.startsAt, locale)}
            {turning !== undefined && ` · ${t("family:birthday.turning", { age: turning })}`}
          </p>
        );
      }

      case "reminders":
      case "health":
      case "checkups":
      case "vaccinations":
      case "shopping":
        return scheduledPanel(kind, title);

      case "medications": {
        if (myMedications.length === 0 && !editing) return null;
        return panel(
          title,
          <>
            {myMedications.length === 0 ? (
              <p className="focus-panel__lead mb-0">{t("manage:scheduled.empty")}</p>
            ) : (
              <ul className="focus-dense-rows list-unstyled mb-0">
                {myMedications.map((medication) => (
                  <li key={medication.id}>
                    <div className="focus-dense-row">
                      <div className="focus-dense-row__body">
                        <p className="focus-dense-row__title" dir="auto">
                          {medication.name}
                        </p>
                        <p className="focus-dense-row__detail" dir="auto">
                          {[medication.dosage, medication.withFood].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="focus-dense-row__meta">
                        <span dir="ltr">
                          {medication.times
                            .map((time) => formatClockTime(time, locale))
                            .join(" · ")}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2">
              <InfoNote tone="caution">{t("manage:health.disclaimer")}</InfoNote>
            </div>
          </>,
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-0"
            onClick={() => setAddingMedication(true)}
          >
            {t("manage:health.addMedication")}
          </button>
        );
      }

      case "feeding":
        return <FeedingSection key={kind} profileId={profile.id} owner={owner} />;

      case "tasting":
        return <TastingSection key={kind} profileId={profile.id} owner={owner} />;

      case "checklists":
        return panel(title, <ChecklistSection ownerId={`family:${profile.id}`} mode={editing ? "edit" : "view"} />);

      case "documents":
      case "media": {
        if (myDocuments.length === 0) return null;
        return panel(title, <RelatedLinks items={myDocuments} />);
      }

      case "notes": {
        if (profile.notes.length === 0 && !editing) return null;
        return panel(
          title,
          <ProjectNotes
            notes={profile.notes}
            isEditing={editing}
            onChange={(notes) => setProfileNotes(profile.id, notes)}
          />
        );
      }

      case "history": {
        const entries = logsFor(logs, profile.id);
        if (entries.length === 0) return null;
        return panel(
          title,
          <ShowMore items={entries} limit={5}>
            {(visible) => (
              <ul className="focus-dense-rows list-unstyled mb-0">
                {visible.map((entry) => (
                  <li key={entry.id}>
                    <div className="focus-dense-row">
                      <div className="focus-dense-row__body">
                        <p className="focus-dense-row__title" dir="auto">
                          {entry.title ?? t(`family:log.${entry.kind}`)}
                        </p>
                        {entry.note && (
                          <p className="focus-dense-row__detail focus-clamp-1" dir="auto">
                            {entry.note}
                          </p>
                        )}
                      </div>
                      <div className="focus-dense-row__meta">
                        <time dateTime={entry.occurredAt}>
                          {formatRelativeDay(entry.occurredAt, locale)}
                        </time>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ShowMore>
        );
      }
    }
  };

  return (
    <>
      <PageHeader
        before={<BackButton />}
        title={profile.name}
        titleIsUserContent
        meta={
          <div className="d-flex align-items-center gap-2">
            <Avatar name={profile.name} photoUrl={profile.photoUrl} size={36} />
            <span className="focus-chip focus-chip--muted">
              {t(`family:types.${profile.type}`)}
            </span>
            {(profile.relationship ?? profile.species) && (
              <span className="focus-dense-row__eyebrow" dir="auto">
                {profile.relationship ?? profile.species}
              </span>
            )}
          </div>
        }
        action={
          <Button
            variant={editing ? "secondary" : "outline-secondary"}
            onClick={() => setEditing((current) => !current)}
          >
            {editing ? t("common:actions.doneEditing") : t("common:actions.edit")}
          </Button>
        }
      />

      {editing && (
        <div className="focus-form-stack mb-3">
          <div className="d-flex flex-wrap gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setEditingProfile(true)}>
              <Icon name="edit" size={15} /> {t("family:editProfile")}
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => setConfirmingDelete(true)}>
              <Icon name="trash" size={15} /> {t("family:delete.action")}
            </Button>
          </div>
          <SectionManager profile={profile} />
        </div>
      )}

{(() => {
        /*
         * One topic at a time. A section that renders nothing takes its topic
         * down with it, so a tab never leads to a blank panel — the one failure
         * grouping could newly introduce.
         */
        const rendered = sectionsOf(profile).map((section) => ({
          section,
          topic: familyTopicOf(section.kind),
          node: renderSection(
            section.kind,
            section.titleOverride ?? t(`family:sections.${section.kind}`)
          ),
        })).filter((entry) => entry.node);

        const topics = [...new Set(rendered.map((entry) => entry.topic))] as FamilyTopic[];
        const active = topic && topics.includes(topic) ? topic : topics[0];
        const shown = rendered.filter((entry) => entry.topic === active);

        return (
          <>
            {topics.length > 1 && (
              <SegmentedNav
                label={t("family:chooseTopic")}
                items={topics.map((value) => ({
                  id: value,
                  label: t(`family:${FAMILY_TOPIC_KEY[value]}`),
                }))}
                value={active}
                onChange={(id) => setTopic(id as FamilyTopic)}
                variant="tabs"
                collapse
              />
            )}
            <div className="focus-panel-grid">
              {shown.map((entry) => (
                <div key={entry.section.id}>{entry.node}</div>
              ))}
            </div>
          </>
        );
      })()}

      {profile.type === "pet" && (
        <div className="mt-3">
          <InfoNote tone="caution">{t("family:safety.pet")}</InfoNote>
        </div>
      )}

      <ProfileFormModal
        show={editingProfile}
        profile={profile}
        onClose={() => setEditingProfile(false)}
      />

      <ScheduledFormModal
        show={addingScheduled || Boolean(editingScheduled)}
        item={editingScheduled}
        defaultRelated={owner}
        onClose={() => {
          setAddingScheduled(false);
          setEditingScheduled(undefined);
        }}
      />

      <MedicationFormModal
        show={addingMedication}
        defaultRelated={owner}
        onClose={() => setAddingMedication(false)}
      />

      <ConfirmDialog
        show={confirmingDelete}
        title={t("family:delete.title", { name: profile.name })}
        body={`${t("family:delete.body")} ${
          relatedCount > 0 ? t("family:delete.keepRelated", { count: relatedCount }) : ""
        }`}
        caution={cascade ? t("family:delete.cascadeCaution") : undefined}
        extra={
          relatedCount > 0 ? (
            <div className="form-check">
              <input
                id="profile-cascade"
                type="checkbox"
                className="form-check-input"
                checked={cascade}
                onChange={(event) => setCascade(event.target.checked)}
              />
              <label htmlFor="profile-cascade" className="form-check-label">
                {t("family:delete.cascadeLabel", { count: relatedCount })}
              </label>
            </div>
          ) : undefined
        }
        confirmLabel={t("family:delete.confirm")}
        onConfirm={() => {
          deleteProfile(profile.id, { cascade });
          navigate("/family");
        }}
        onCancel={() => {
          setConfirmingDelete(false);
          setCascade(false);
        }}
      />

    </>
  );
}
