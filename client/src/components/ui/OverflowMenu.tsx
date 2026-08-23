import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

export interface OverflowAction {
  id: string;
  /** Interface copy, already translated. */
  label: string;
  onSelect: () => void;
  /** Renders the item in the danger colour and last. Still says what it does. */
  danger?: boolean;
  icon?: ReactNode;
}

interface OverflowMenuProps {
  /** Accessible name — what this menu acts on. */
  label: string;
  actions: OverflowAction[];
}

/**
 * The secondary actions on a row, behind one button.
 *
 * A row with five icon buttons is five things competing with the row's own
 * content, and on a phone they are five 30px targets in a 44px line. One
 * trigger, opened deliberately, is both calmer and easier to hit.
 *
 * The trigger is **always visible** — never revealed on hover. That is the rule
 * this component exists to keep: a control reachable only by hovering is
 * unreachable on a touch device, and "it is in the menu" is only an answer if
 * the menu can be found.
 *
 * Closing on Escape returns focus to the trigger, so keyboard users are not
 * dropped at the top of the document.
 */
export function OverflowMenu({ label, actions }: OverflowMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPointer = (event: MouseEvent): void => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (actions.length === 0) return null;

  const ordered = [...actions].sort((a, b) => Number(a.danger ?? false) - Number(b.danger ?? false));

  return (
    <div className="focus-overflow" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className="focus-icon-button focus-overflow__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={t("actions.moreFor", { name: label })}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="more" size={16} />
      </button>

      {open && (
        <div className="focus-overflow__menu" id={id} role="menu" aria-label={label}>
          {ordered.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={`focus-overflow__item${action.danger ? " is-danger" : ""}`}
              onClick={() => {
                setOpen(false);
                /*
                 * Back to the trigger before the action runs.
                 *
                 * Closing the menu unmounts the item that was focused, and
                 * focus then falls to `<body>` — so a keyboard user who
                 * reorders a row loses their place entirely and has to tab from
                 * the top of the document to move it again. Escape already
                 * restored focus here; choosing something did not, which is the
                 * path people actually take.
                 *
                 * Ordering matters: an action that opens a dialog or navigates
                 * takes focus for itself immediately afterwards, so this only
                 * decides where focus lands when the action leaves it alone.
                 */
                trigger.current?.focus();
                action.onSelect();
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
