import { ErrorState } from "focus-client";

/**
 * The single place an error is shown to the user — `alert()` is never used
 * anywhere in Focus. The heading and the retry label come from the component's
 * own `t()`; the message is the only thing the caller writes, and it is always
 * a sentence a person can act on, never a stack trace.
 */

export const NotFound = () => (
  <ErrorState
    title="הדף לא נמצא"
    message='אין דף עם המזהה "sorcol-archive". ייתכן שהוא נמחק, או שהקישור נשמר לפני שינוי שם.'
  />
);

export const DefaultTitle = () => (
  <ErrorState message="לא הצלחנו לטעון את פרטי הטיול. הנתונים שמורים מקומית ולא אבדו — כדאי לנסות שוב." />
);

export const WithRequestId = () => (
  <ErrorState
    message="השמירה נכשלה. השינוי האחרון בפתק לא נשמר."
    requestId="4f9c2a1e-7b30-4d55-9e01-c8a2f6b3d714"
  />
);

export const WithRetry = () => (
  <ErrorState
    title="הרשימה לא נטענה"
    message="רשימת הקניות של סבתא לא נטענה. אפשר לנסות שוב בלי לאבד את מה שכבר סומן."
    requestId="a17d0c93-5e48-4b6a-8f22-19d7e0c4ab56"
    onRetry={() => undefined}
  />
);
