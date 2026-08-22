import { LoadingState } from "focus-client";

/**
 * One shared spinner, announced with `role="status"`. The label defaults to the
 * interface's own word for loading; a caller only overrides it when saying
 * *what* is loading is genuinely more useful than saying that something is.
 */

export const Default = () => <LoadingState />;

export const WithLabel = () => <LoadingState label="טוען את המתכונים…" />;

export const InPanel = () => (
  <div className="focus-panel">
    <h3 className="focus-panel__title mb-0">ביטוחים ומנויים</h3>
    <LoadingState label="טוען מנויים…" />
  </div>
);
