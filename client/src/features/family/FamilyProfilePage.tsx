import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { Avatar } from "../../components/ui/Avatar";
import { BackButton } from "../../components/ui/BackButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { InfoNote } from "../../components/ui/InfoNote";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay, formatShortDate } from "../../lib/format";
import { ageAtNextBirthday, birthdayEventFor } from "../../lib/birthdays";
import {
  FAMILY_NOTE_TEMPLATES,
  footprintOf,
  nextDateFor,
} from "../../lib/familySelectors";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import { usePages } from "../../state/pagesContext";
import type { ProjectNote } from "../../types";
import { ProjectNotes } from "../page/ProjectNotes";
import { MaterialsPanel } from "../resources/MaterialsPanel";
import { ProfileFormModal } from "./ProfileFormModal";
import { ProfileSchedule } from "./ProfileSchedule";

type Tab = "schedule" | "notes" | "materials";
const TABS: Tab[] = ["schedule", "notes", "materials"];

/**
 * One person or animal.
 *
 * Three tabs — **schedule · notes · materials** — with who they are and what is
 * nearest above them. What that replaced: a list of opt-in sections (health,
 * medicines, vaccinations, feeding, tasting, shopping, checklists, documents,
 * media, history) grouped into four derived topics. Ten possible headings meant
 * a grandmother's page had four panels with one row each, and switching them on
 * was a configuration task before the page was useful.
 *
 * The sections themselves were never the content — a vaccination and an
 * appointment are both a `ScheduledItem` with a category, so they belong in one
 * list, sorted by when they happen.
 *
 * **Focus is not a medical record.** Every medical value here is the user's own
 * text, stored and shown back unchanged. Nothing is read, calculated,
 * interpreted or turned into an alert.
 */
export function FamilyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["family", "common", "manage"]);
  const { locale } = useLocale();
  const navigate = useNavigate();

  const { getProfile, logs, setProfileNotes, deleteProfile } = useFamily();
  const { scheduled, medications } = useManage();
  const { savedItems, savedItemsFor } = usePages();

  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [cascade, setCascade] = useState(false);

  const profile = id ? getProfile(id) : undefined;

  /*
   * Material is attached by `contextIds` — the app's one association
   * mechanism, the same one projects, learning, leisure and training use.
   * Nothing is inferred from the profile's name.
   */
  const materials = useMemo(() => (id ? savedItemsFor(id) : []), [savedItemsFor, id]);

  const tabParam = params.get("tab");
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "schedule";

  if (!profile) {
    return (
      <>
        <BackButton />
        <EmptyState
          title={t("common:errors.pageNotFoundTitle")}
          hint={t("common:errors.pageNotFoundMessage", { id: id ?? "" })}
        />
      </>
    );
  }

  const setParam = (changes: Record<string, string | undefined>): void => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === "" || value === "all" || value === "1") next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  };

  const birthday = birthdayEventFor(profile);
  const turning = profile.birthDate ? ageAtNextBirthday(profile.birthDate) : undefined;
  const next = nextDateFor(profile, scheduled);
  const footprint = footprintOf(profile, scheduled, medications, logs, savedItems);

  const tabs: SegmentedItem[] = [
    { id: "schedule", label: t("family:tabs.schedule") },
    {
      id: "notes",
      label: t("family:tabs.notes"),
      badge: profile.notes.length > 0 ? String(profile.notes.length) : undefined,
    },
    {
      id: "materials",
      label: t("family:tabs.materials"),
      badge: materials.length > 0 ? String(materials.length) : undefined,
    },
  ];

  return (
    <>
      <BackButton />

      <PageHeader
        title={profile.name}
        titleIsUserContent
        meta={
          <>
            <Avatar name={profile.name} photoUrl={profile.photoUrl} size={36} />
            <span className="focus-chip focus-chip--muted">
              {t(`family:types.${profile.type}`)}
            </span>
            {(profile.relationship ?? profile.species) && (
              <span className="focus-dense-row__eyebrow" dir="auto">
                {profile.relationship ?? profile.species}
              </span>
            )}
            {/* Derived on every read from the birth date — never a stored event. */}
            {birthday && turning !== undefined && (
              <span className="text-secondary small">
                {t("family:turningOn", {
                  age: turning,
                  when: formatShortDate(birthday.startsAt, locale),
                })}
              </span>
            )}
          </>
        }
        action={
          <>
            <Button variant="outline-secondary" size="sm" onClick={() => setEditingProfile(true)}>
              {t("family:editProfile")}
            </Button>
            <Button
              variant={editing ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => setEditing((current) => !current)}
            >
              <Icon name={editing ? "check" : "edit"} size={15} />
              {editing ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </>
        }
      />

      {/* The nearest thing, above the tabs. Renders nothing when there is none. */}
      {next && (
        <p className="focus-project-band">
          <span className="focus-project-band__main">
            <span className="focus-project-band__label">
              {t(`family:next.${next.label}`)}
            </span>
            <span className="focus-project-band__action d-block" dir="auto">
              {next.title}
            </span>
          </span>
          <span className="focus-pager__count">
            <time dateTime={next.at}>{formatRelativeDay(next.at, locale)}</time>
          </span>
        </p>
      )}

      <SegmentedNav
        label={t("family:chooseTopic")}
        items={tabs}
        value={tab}
        onChange={(id) => setParam({ tab: id, page: undefined, kind: undefined, q: undefined })}
        variant="tabs"
        idPrefix="family"
        collapse
      />

      <div
        role="tabpanel"
        id={`family-panel-${tab}`}
        aria-labelledby={`family-tab-${tab}`}
        className="focus-collection__body"
      >
        {tab === "schedule" && <ProfileSchedule profile={profile} />}

        {tab === "notes" && (
          <ProjectNotes
            notes={profile.notes}
            isEditing={editing}
            templates={FAMILY_NOTE_TEMPLATES}
            onChange={(notes: ProjectNote[]) => setProfileNotes(profile.id, notes)}
          />
        )}

        {tab === "materials" && (
          <MaterialsPanel
            contextId={profile.id}
            materials={materials}
            canAdd={editing}
            filter={(params.get("kind") as never) ?? undefined}
            query={params.get("q") ?? undefined}
            page={Number(params.get("page") ?? "1") || 1}
            onFilterChange={(value) => setParam({ kind: value, page: undefined })}
            onQueryChange={(value) => setParam({ q: value, page: undefined })}
            onPageChange={(value) => setParam({ page: String(value) })}
          />
        )}
      </div>

      {profile.type === "pet" && (
        <div className="mt-3">
          <InfoNote tone="caution">{t("family:safety.pet")}</InfoNote>
        </div>
      )}

      {editing && (
        <div className="focus-danger-zone">
          <Button variant="outline-danger" size="sm" onClick={() => setConfirmingDelete(true)}>
            <Icon name="trash" size={14} /> {t("family:delete.action")}
          </Button>
        </div>
      )}

      <ProfileFormModal
        show={editingProfile}
        profile={profile}
        onClose={() => setEditingProfile(false)}
      />

      <ConfirmDialog
        show={confirmingDelete}
        title={t("family:delete.title", { name: profile.name })}
        body={`${t("family:delete.body")} ${
          footprint.owned > 0 ? t("family:delete.keepRelated", { count: footprint.owned }) : ""
        }`}
        caution={cascade ? t("family:delete.cascadeCaution") : undefined}
        extra={
          footprint.owned > 0 || footprint.materials > 0 ? (
            <>
              {footprint.owned > 0 && (
                <div className="form-check">
                  <input
                    id="profile-cascade"
                    type="checkbox"
                    className="form-check-input"
                    checked={cascade}
                    onChange={(event) => setCascade(event.target.checked)}
                  />
                  <label htmlFor="profile-cascade" className="form-check-label">
                    {t("family:delete.cascadeLabel", { count: footprint.owned })}
                  </label>
                </div>
              )}
              {/*
                Saved items are never deleted with a profile: one may belong to
                three other things. Only the link goes, and the dialog says so
                rather than leaving it to be discovered.
              */}
              {footprint.materials > 0 && (
                <p className="form-text mb-0">
                  {t("family:delete.materialsKept", { count: footprint.materials })}
                </p>
              )}
            </>
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
