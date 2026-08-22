import { BackButton, PageHeader, StatusBadge } from "focus-client";

/**
 * Back goes to wherever the user came from — filter and search query included —
 * via history, falling back to the overview when there is nothing to go back to
 * (a shared link, a refresh). Its arrow is one of the few icons that mirrors in
 * RTL, because it points somewhere.
 */

export const Button = () => <BackButton />;

export const AboveAPageHeader = () => (
  <PageHeader
    before={<BackButton />}
    title="Sorcol"
    titleIsUserContent
    meta={<StatusBadge status="active" />}
    lead="פרויקט פעיל · עודכן לאחרונה לפני יומיים"
  />
);
