import { ConfirmDialog } from "focus-client";

/**
 * The one confirmation dialog, used only where the action is genuinely hard to
 * undo. The body states the consequence with real numbers, because "this will
 * also delete 3 appointments and 1 medication" is a decision and "are you
 * sure?" is a reflex.
 *
 * Deleting a family profile is the canonical case: the cascade is counted and
 * offered as an explicit choice, never applied quietly.
 */

export const DeleteProfileWithCascade = () => (
  <ConfirmDialog
    show
    title="למחוק את לונה?"
    body="הפרופיל יימחק. 3 תורים, 2 תרופות ו-4 רשומות יומן מצביעים עליו."
    caution="הפעולה אינה הפיכה."
    confirmLabel="מחיקה"
    extra={
      <div className="form-check">
        <input className="form-check-input" type="checkbox" id="cascade" defaultChecked={false} />
        <label className="form-check-label" htmlFor="cascade">
          למחוק גם את 9 הרשומות המקושרות
        </label>
      </div>
    }
    onConfirm={() => {}}
    onCancel={() => {}}
  />
);

export const SimpleDeletion = () => (
  <ConfirmDialog
    show
    title="למחוק את הפריט השמור?"
    body="הפריט יוסר מ-2 העמודים שמפנים אליו."
    confirmLabel="מחיקה"
    onConfirm={() => {}}
    onCancel={() => {}}
  />
);
