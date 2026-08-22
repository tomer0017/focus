import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar } from "../../components/ui/Avatar";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay, formatShortDate } from "../../lib/format";
import { birthdayEventFor, ageAtNextBirthday } from "../../lib/birthdays";
import { lastActivityFor, nextAttentionFor } from "../../lib/familySelectors";
import type { FamilyProfile, QuickLogEntry, ScheduledItem } from "../../types";

interface ProfileCardProps {
  profile: FamilyProfile;
  scheduled: ScheduledItem[];
  logs: QuickLogEntry[];
}

/**
 * One person or animal, compact.
 *
 * Four facts at most, and every one of them is skipped when there is nothing to
 * say: no picture means initials rather than an empty square, no outstanding
 * item means no line, and no birth date means no countdown. A profile with
 * nothing on it is a name and a relationship, which is exactly as tall as it
 * should be.
 */
export function ProfileCard({ profile, scheduled, logs }: ProfileCardProps) {
  const { t } = useTranslation(["family", "manage", "common"]);
  const { locale } = useLocale();

  const attention = nextAttentionFor(profile, scheduled);
  const birthday = birthdayEventFor(profile);
  const lastActivity = lastActivityFor(profile, scheduled, logs);
  const turning = profile.birthDate ? ageAtNextBirthday(profile.birthDate) : undefined;

  return (
    <article className="focus-profile-card">
      <Avatar name={profile.name} photoUrl={profile.photoUrl} size={44} />

      <div className="focus-profile-card__body">
        <h3 className="focus-profile-card__name">
          <Link to={`/family/${profile.id}`} className="stretched-link" dir="auto">
            {profile.name}
          </Link>
        </h3>

        {(profile.relationship ?? profile.species) && (
          <p className="focus-profile-card__relation" dir="auto">
            {profile.relationship ?? profile.species}
          </p>
        )}

        {attention && (
          <p
            className={`focus-profile-card__next${attention.overdue ? " focus-overdue" : ""}`}
            dir="auto"
          >
            {attention.item.title}
            {attention.item.dueAt && (
              <>
                {" · "}
                <time dateTime={attention.item.dueAt}>
                  {formatRelativeDay(attention.item.dueAt, locale)}
                </time>
              </>
            )}
          </p>
        )}

        {birthday && (
          <p className="focus-profile-card__relation">
            <time dateTime={birthday.startsAt}>{formatShortDate(birthday.startsAt, locale)}</time>
            {turning !== undefined && ` · ${t("family:birthday.turning", { age: turning })}`}
          </p>
        )}

        {lastActivity && (
          <p className="focus-profile-card__relation">
            {t("family:card.lastActivity", { when: formatRelativeDay(lastActivity, locale) })}
          </p>
        )}
      </div>
    </article>
  );
}
