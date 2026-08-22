import { EmptyState, Icon } from "focus-client";

/**
 * The whole-screen "there is nothing here yet" panel. A *section* with no
 * content renders nothing at all — this is only ever reached when an entire
 * screen is empty, which is why it is allowed to be large and to carry the one
 * action that would fix it.
 */

export const Screen = () => (
  <EmptyState
    title="עדיין אין כאן פרויקטים"
    hint="פרויקט ראשון יופיע כאן ברגע שתפתחי אחד — למשל שיפוץ המטבח או החזרה ללימודי איטלקית."
  />
);

export const WithAction = () => (
  <EmptyState
    title="אין לוח חזון לשנה הזאת"
    hint="לוח חזון הוא קולאז' של תמונות ומטרות. אפשר לפתוח אחד ולהוסיף אליו אריחים בכל רגע."
    action={
      <button type="button" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1">
        <Icon name="plus" size={15} />
        <span>יצירת לוח חזון</span>
      </button>
    }
  />
);

export const NoSearchResults = () => (
  <EmptyState
    title='לא נמצאו תוצאות ל"קרמיקה"'
    hint="אפשר לנסות מילה אחרת, או לחפש לפי תגית שהוספת בעצמך."
  />
);

export const TitleOnly = () => <EmptyState title="לא נשמרו עדיין מתכונים" />;
