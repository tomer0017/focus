import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useRoutines } from "../../state/routinesContext";
import { usePages } from "../../state/pagesContext";
import { useLocale } from "../../i18n/useLocale";
import { formatDayKey, formatRelativeDay } from "../../lib/format";
import { dateKeyToIso, todayKey } from "../../lib/dateKey";
import {
  isCompletedOn,
  isOverdue,
  lastCompletionKey,
  nextPlannedKey,
  scheduleSummaryArgs,
} from "../../lib/routineSchedule";
import { Icon } from "../../components/ui/Icon";
import { BackButton } from "../../components/ui/BackButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { RoutineDomainBadge, SpaceBadge } from "../../components/ui/Badges";
import { SavedItemCard } from "../../components/ui/SavedItemCard";
import { ErrorState } from "../../components/ui/ErrorState";
import { Section } from "../sections/Section";
import { RoutineCalendarCard } from "./RoutineCalendarCard";
import { RoutineFormModal } from "./RoutineFormModal";

/**
 * One recurring activity: when it is next planned, when it last happened, its
 * month of history, and whatever documents belong with it.
 *
 * There is no weekly grid and no time slot anywhere on this screen. A routine
 * is a rhythm, not an appointment, and the calendar it needs is the one that
 * answers "have I been doing this?".
 */
export function RoutinePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["pages", "common"]);
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { getRoutine, updateRoutine, toggleCompletionOn, deleteRoutine } = useRoutines();
  const { savedItems } = usePages();
  const [isEditing, setIsEditing] = useState(false);

  const routine = id ? getRoutine(id) : undefined;

  if (!routine) {
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

  const today = todayKey();
  const doneToday = isCompletedOn(routine, today);
  const last = lastCompletionKey(routine);
  const next = nextPlannedKey(routine);
  const summary = scheduleSummaryArgs(routine.schedule);
  const documents = savedItems.filter((item) => routine.documentIds.includes(item.id));

  return (
    <div className="focus-detail">
      <div className="mb-3">
        <BackButton />
      </div>

      <PageHeader
        title={routine.title}
        titleIsUserContent
        meta={
          <>
            <RoutineDomainBadge domain={routine.domain} />
            <SpaceBadge spaceId={routine.spaceId} />
            <span className="focus-chip focus-chip--muted">
              {t(`pages:${summary.key}`, summary.values)}
            </span>
            {isOverdue(routine) && (
              <span className="focus-chip focus-chip--warning focus-chip--icon">
                <Icon name="alert" size={12} />
                {t("pages:routine.overdue")}
              </span>
            )}
          </>
        }
        action={
          <>
            <Button
              variant={doneToday ? "success" : "primary"}
              size="sm"
              onClick={() => toggleCompletionOn(routine.id, today)}
            >
              <Icon name="check" size={15} />
              {doneToday ? t("pages:routine.doneToday") : t("common:actions.markDoneToday")}
            </Button>
            <Button variant="outline-primary" size="sm" onClick={() => setIsEditing(true)}>
              <Icon name="edit" size={15} />
              {t("common:actions.edit")}
            </Button>
          </>
        }
      />

      {routine.description && (
        <p className="focus-user-block focus-page-lead" dir="auto">
          {routine.description}
        </p>
      )}

      <div className="focus-brief__facts mb-4">
        <div className="focus-fact">
          <p className="focus-fact__label">{t("common:fields.lastTime")}</p>
          <p className="focus-fact__value mb-0">
            {last ? (
              <time dateTime={dateKeyToIso(last)}>
                {formatDayKey(last, locale)} · {formatRelativeDay(dateKeyToIso(last), locale)}
              </time>
            ) : (
              t("pages:routine.neverDone")
            )}
          </p>
        </div>
        <div className="focus-fact">
          <p className="focus-fact__label">{t("common:fields.nextTime")}</p>
          <p className="focus-fact__value mb-0">
            {next ? (
              <time dateTime={dateKeyToIso(next)}>
                {formatDayKey(next, locale)} · {formatRelativeDay(dateKeyToIso(next), locale)}
              </time>
            ) : (
              t("pages:routine.noPlannedDate")
            )}
          </p>
        </div>
      </div>

      <Section title={t("pages:routine.history")} hasContent>
        <RoutineCalendarCard routine={routine} />
      </Section>

      <Section title={t("pages:routine.documents")} hasContent={documents.length > 0}>
        <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
          {documents.map((item) => (
            <li key={item.id}>
              <SavedItemCard item={item} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t("pages:routine.notes")} hasContent={Boolean(routine.notes)}>
        <p className="focus-note-panel mb-0" dir="auto">
          {routine.notes}
        </p>
      </Section>

      <div className="focus-danger-zone">
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => {
            deleteRoutine(routine.id);
            navigate("/training");
          }}
        >
          <Icon name="trash" size={15} />
          {t("pages:routine.delete")}
        </Button>
      </div>

      <RoutineFormModal
        show={isEditing}
        routine={routine}
        onClose={() => setIsEditing(false)}
        onSubmit={(draft) => updateRoutine(routine.id, draft)}
      />
    </div>
  );
}
