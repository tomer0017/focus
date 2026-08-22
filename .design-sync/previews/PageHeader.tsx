import { PageHeader, BackButton, Icon, StatusBadge, SpaceBadge, EventKindBadge } from "focus-client";
import Button from "react-bootstrap/Button";

/**
 * The one header every screen uses.
 *
 * The primary action sits **beside** the title, not at the far edge of the
 * 1200px container: at that distance nobody reads "אירוע חדש" as belonging to
 * "אירועים", and `space-between` produces two unrelated things on one line. The
 * pair wraps under the title rather than stretching, and on a phone the action
 * takes its own full-width row.
 *
 * `title` is interface copy by default; a screen showing something the user
 * named passes `titleIsUserContent` so it follows its own direction.
 */

export const TitleAndAction = () => (
  <PageHeader
    title="לומדת"
    action={
      <Button variant="primary">
        <Icon name="plus" size={16} /> נושא חדש
      </Button>
    }
  />
);

export const TitleActionAndLead = () => (
  <PageHeader
    title="ניהול שוטף"
    lead="ביטוחים, מנויים, כסף, בריאות והקניות — במקום אחד."
    action={
      <Button variant="primary">
        <Icon name="plus" size={16} /> הוספה
      </Button>
    }
  />
);

/** A detail screen: back button above, badges and a date as meta, a user-named title. */
export const DetailHeader = () => (
  <PageHeader
    before={<BackButton />}
    title="יום הולדת 60 לאמא"
    titleIsUserContent
    meta={
      <>
        <EventKindBadge kind="birthday" />
        <SpaceBadge spaceId="personal" />
        <span className="text-secondary small">
          <time dateTime="2026-11-14T18:00:00.000Z">14 בנובמבר 2026, 18:00</time>
        </span>
      </>
    }
    action={
      <Button variant="outline-primary" size="sm">
        <Icon name="edit" size={15} /> עריכה
      </Button>
    }
  />
);

/** A title in English inside a Hebrew frame — `titleIsUserContent` is what keeps it readable. */
export const UserContentTitle = () => (
  <PageHeader
    before={<BackButton />}
    title="Painter Platform"
    titleIsUserContent
    meta={
      <>
        <StatusBadge status="active" />
        <SpaceBadge spaceId="work-tech" />
      </>
    }
    action={
      <Button variant="outline-primary" size="sm">
        <Icon name="edit" size={15} /> עריכה
      </Button>
    }
  />
);
