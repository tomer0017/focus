import { CompactList, CompactRow, OverflowMenu, StatusBadge } from "focus-client";

/**
 * The secondary actions on a row, behind one trigger.
 *
 * The trigger is **always visible** — never a hover reveal. That is the rule the
 * component exists to keep: a control reachable only by hovering is unreachable
 * on a touch device, and "it is in the menu" is only an answer if the menu can
 * be found. It sits at full opacity even inside a dense row, where every other
 * secondary action is deliberately quiet.
 *
 * A sheet cannot show the open state — it needs a click — so what these cells
 * demonstrate is the closed one, which is the state the rule is about.
 */

export const OnARow = () => (
  <CompactList>
    <li>
      <CompactRow
        title="Sorcol"
        eyebrow="טכנולוגיים"
        detail="Review the models and print one trial size."
        badges={<StatusBadge status="active" />}
        meta={<span>לפני יומיים</span>}
        actions={
          <OverflowMenu
            label="Sorcol"
            actions={[
              { id: "paused", label: "העברה למוקפא", onSelect: () => {} },
              { id: "done", label: "העברה להושלם", onSelect: () => {} },
              { id: "up", label: "העברה למעלה", onSelect: () => {} },
            ]}
          />
        }
      />
    </li>
  </CompactList>
);

/** A destructive action sorts last and is coloured — and still says what it does. */
export const WithADangerousAction = () => (
  <OverflowMenu
    label="לוח חזון"
    actions={[
      { id: "edit", label: "עריכת האריח", onSelect: () => {} },
      { id: "remove", label: "הסרת האריח", onSelect: () => {}, danger: true },
    ]}
  />
);

/** Nothing to offer: the component renders nothing rather than an empty menu. */
export const NoActions = () => <OverflowMenu label="פריט" actions={[]} />;
