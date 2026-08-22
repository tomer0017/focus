import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { Icon } from "../../components/ui/Icon";
import { LabelledText } from "../../components/ui/LabelledText";
import { useLocale } from "../../i18n/useLocale";
import { formatDate } from "../../lib/format";
import { urgencyOf } from "../../lib/eventTiming";
import { eventHref, isDerivedBirthday } from "../../lib/birthdays";
import { EventCountdown } from "../events/EventCountdown";
import type { FocusEvent } from "../../types";

interface EventListProps {
  title: string;
  events: FocusEvent[];
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/** Dated occasions: what it is, when it is, and the one next step. */
export function EventList({ title, events, span }: EventListProps) {
  const { t } = useTranslation(["events", "common", "family"]);
  const { locale } = useLocale();

  /*
   * A derived birthday stores the person's name and nothing else — composing
   * "Mum's birthday" happens here, at render, so no language is ever written
   * into data. The same rule as event section titles and checklist groups.
   */
  const titleOf = (event: FocusEvent): string =>
    isDerivedBirthday(event) ? t("family:birthday.label", { name: event.title }) : event.title;

  return (
    <Section title={title} hasContent={events.length > 0} span={span ?? spanFor(events.length)}>
      <ul className="list-unstyled focus-grid focus-grid--chips mb-0">
        {events.map((event) => (
          <li key={event.id}>
            <article className={`focus-chip-card focus-chip-card--${urgencyOf(event)}`}>
              <p className="focus-chip-card__eyebrow">
                <Icon name="calendar" size={13} />
                {t(`events:kinds.${event.kind}`)}
              </p>
              <h3 className="focus-chip-card__title">
                <Link to={eventHref(event)} className="stretched-link" dir="auto">
                  {titleOf(event)}
                </Link>
              </h3>
              {/* The countdown leads; the date stays underneath, because
                  "in 9 days" is no use for writing in a diary. */}
              <EventCountdown event={event} />
              <p className="focus-chip-card__detail mb-0">
                <time dateTime={event.startsAt}>{formatDate(event.startsAt, locale)}</time>
              </p>
              {event.nextAction && (
                <LabelledText
                  label={t("common:fields.nextAction")}
                  className="focus-chip-card__detail"
                >
                  {event.nextAction}
                </LabelledText>
              )}
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
