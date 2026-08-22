import { useTranslation } from "react-i18next";
import { Avatar } from "../../components/ui/Avatar";
import { CompactRow } from "../../components/ui/CompactRow";
import { OverflowMenu } from "../../components/ui/OverflowMenu";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { ageAtNextBirthday, birthdayEventFor } from "../../lib/birthdays";
import { nextAttentionFor } from "../../lib/familySelectors";
import type { FamilyProfile, ScheduledItem } from "../../types";

interface ProfileRowProps {
  profile: FamilyProfile;
  scheduled: ScheduledItem[];
  onEdit: (profile: FamilyProfile) => void;
}

/**
 * One person or animal, on one line.
 *
 * The line under the name is **the single nearest thing that wants doing**, not
 * a summary of everything on the profile. A list of everyone is for choosing
 * who to open; printing three reminders each turns twelve profiles into a page
 * nobody reads.
 *
 * Every fact is skipped when there is nothing to say: no picture means initials
 * rather than a grey square, nothing outstanding means no line at all, and no
 * birth date means no countdown. A profile with nothing on it is a name and a
 * relationship, and is exactly that tall.
 */
export function ProfileRow({ profile, scheduled, onEdit }: ProfileRowProps) {
  const { t } = useTranslation(["family", "common"]);
  const { locale } = useLocale();

  const attention = nextAttentionFor(profile, scheduled);
  const birthday = birthdayEventFor(profile);
  const turning = profile.birthDate ? ageAtNextBirthday(profile.birthDate) : undefined;

  return (
    <CompactRow
      title={profile.name}
      href={`/family/${profile.id}`}
      eyebrow={profile.relationship ?? profile.species ?? t(`family:types.${profile.type}`)}
      detail={attention?.item.title}
      leading={<Avatar name={profile.name} photoUrl={profile.photoUrl} size={36} />}
      // Late is the one state loud enough to colour a row in a list of people.
      tone={attention?.overdue ? "due" : "neutral"}
      badges={
        attention?.overdue ? (
          <span className="focus-overdue">{t("manage:now.overdue", { ns: "manage" })}</span>
        ) : undefined
      }
      meta={
        <>
          {attention?.item.dueAt && (
            <time dateTime={attention.item.dueAt}>
              {formatRelativeDay(attention.item.dueAt, locale)}
            </time>
          )}
          {birthday && turning !== undefined && (
            <span>{t("family:turningSoon", { age: turning })}</span>
          )}
        </>
      }
      actions={
        <OverflowMenu
          label={t("common:actions.moreFor", { name: profile.name })}
          actions={[
            { id: "edit", label: t("family:editProfile"), onSelect: () => onEdit(profile) },
          ]}
        />
      }
    />
  );
}
