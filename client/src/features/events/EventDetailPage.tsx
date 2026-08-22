import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useEvents } from "../../state/eventsContext";
import { usePages } from "../../state/pagesContext";
import { useVision } from "../../state/visionContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDateTime } from "../../lib/format";
import { ADDABLE_SECTION_KINDS, normaliseSectionOrder } from "../../lib/eventTemplates";
import { Icon } from "../../components/ui/Icon";
import { BackButton } from "../../components/ui/BackButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { EventKindBadge, SpaceBadge } from "../../components/ui/Badges";
import { ErrorState } from "../../components/ui/ErrorState";
import { EventSectionCard } from "./EventSectionCard";
import { EventCountdown } from "./EventCountdown";
import { EventPreparation } from "./EventPreparation";
import { EventReminders } from "./EventReminders";
import type { EventSectionKind } from "../../types";

/**
 * One event, built from its sections.
 *
 * The date and the next action lead; everything else is the user's own
 * structure, which they can rename, reorder, add to and delete. Nothing on this
 * screen is fixed by the event's kind after creation — the template only chose
 * where to start.
 */
export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["events", "common"]);
  const { locale } = useLocale();
  const navigate = useNavigate();
  const {
    getEvent,
    updateEvent,
    deleteEvent,
    addSection,
    removeSection,
    moveSectionBy,
    updateSection,
  } = useEvents();
  const { savedItems, collectionEntries } = usePages();
  const { boards } = useVision();
  const [newSectionKind, setNewSectionKind] = useState<EventSectionKind>("tasks");
  /*
   * Viewing is the default. Opening a birthday used to show a delete button, two
   * reorder arrows and an open textarea beside every line — which reads as a
   * content management system, not as a plan for a dinner.
   */
  const [isEditing, setIsEditing] = useState(false);

  const event = id ? getEvent(id) : undefined;

  if (!event) {
    return (
      <div className="focus-detail">
        <div className="mb-3">
          <BackButton />
        </div>
        <ErrorState
          title={t("common:errors.pageNotFoundTitle")}
          message={t("common:errors.pageNotFoundMessage", { id: id ?? "" })}
        />
      </div>
    );
  }

  const sections = normaliseSectionOrder(event.sections);

  return (
    <div className="focus-detail focus-detail--wide">
      <PageHeader
        before={<BackButton />}
        title={event.title}
        titleIsUserContent
        meta={
          <>
            <EventKindBadge kind={event.kind} />
            <SpaceBadge spaceId={event.spaceId} />
            <span className="text-secondary small">
              <time dateTime={event.startsAt}>{formatDateTime(event.startsAt, locale)}</time>
            </span>
          </>
        }
        action={
          <>
            <Button
              variant={isEditing ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setIsEditing((current) => !current)}
            >
              <Icon name={isEditing ? "check" : "edit"} size={15} />
              {isEditing ? t("events:doneEditing") : t("events:editEvent")}
            </Button>
          </>
        }
      />

      {/*
        * The countdown is the biggest thing under the title. An event is a
        * thing that happens at a time, and "in 9 days" is what makes it feel
        * like one — the date alone reads as a filing reference.
        */}
      <EventCountdown event={event} size="large" />

      {event.description && (
        <p className="focus-user-block focus-page-lead" dir="auto">
          {event.description}
        </p>
      )}

      <EventReminders
        event={event}
        isEditing={isEditing}
        onChange={(reminders) => updateEvent(event.id, { reminders })}
      />

      {isEditing && (
        <EventPreparation
          event={event}
          onChange={(patch) => updateEvent(event.id, patch)}
        />
      )}

      {isEditing && (
        <p className="focus-edit-note">
          <Icon name="alert" size={14} />
          {t("events:editHint")}
        </p>
      )}

      {isEditing ? (
        <div className="focus-brief__action mb-4">
          <label className="focus-brief__action-label" htmlFor="event-next-action">
            {t("common:fields.nextAction")}
          </label>
          <input
            id="event-next-action"
            className="form-control focus-brief__action-input"
            dir="auto"
            value={event.nextAction ?? ""}
            placeholder={t("events:nextActionPlaceholder")}
            onChange={(changeEvent) =>
              updateEvent(event.id, { nextAction: changeEvent.target.value })
            }
          />
        </div>
      ) : (
        event.nextAction && (
          <div className="focus-brief__action mb-4">
            <p className="focus-brief__action-label">{t("common:fields.nextAction")}</p>
            <p className="focus-brief__action-value mb-0" dir="auto">
              {event.nextAction}
            </p>
          </div>
        )
      )}

      <div className="focus-event-sections">
        {sections.map((section, index) => (
          <EventSectionCard
            key={section.id}
            section={section}
            mode={isEditing ? "edit" : "view"}
            savedItems={savedItems}
            collectionEntries={collectionEntries}
            visionBoards={boards}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
            onPatch={(patch) => updateSection(event.id, section.id, patch)}
            onMove={(direction) => moveSectionBy(event.id, section.id, direction)}
            onRemove={() => removeSection(event.id, section.id)}
          />
        ))}
      </div>

      {isEditing && (
      <form
        className="focus-inline-form focus-add-section"
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault();
          addSection(event.id, newSectionKind);
        }}
      >
        <label htmlFor="add-section" className="form-label fw-medium mb-0">
          {t("events:addSection")}
        </label>
        <select
          id="add-section"
          className="form-select form-select-sm"
          value={newSectionKind}
          onChange={(changeEvent) =>
            setNewSectionKind(changeEvent.target.value as EventSectionKind)
          }
        >
          {ADDABLE_SECTION_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {t(`events:sectionKinds.${kind}`)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline-primary" size="sm">
          {t("events:add")}
        </Button>
      </form>
      )}

      {isEditing && (
      <div className="focus-danger-zone">
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => {
            deleteEvent(event.id);
            navigate("/events");
          }}
        >
          <Icon name="trash" size={15} />
          {t("events:deleteEvent")}
        </Button>
      </div>
      )}
    </div>
  );
}
