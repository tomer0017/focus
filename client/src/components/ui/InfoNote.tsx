import { Icon } from "./Icon";

interface InfoNoteProps {
  /** Interface copy. One or two sentences, never a wall. */
  children: string;
  tone?: "info" | "caution";
}

/**
 * The small honest line.
 *
 * Used for the two things this app must keep saying and must not shout:
 * reminders are local to an open tab, and nothing here is medical or financial
 * advice. Both are true, both matter, and both become invisible if they are
 * printed on every card in a yellow box — so this is one quiet line, placed
 * where the claim is actually being made.
 */
export function InfoNote({ children, tone = "info" }: InfoNoteProps) {
  return (
    <p className={`focus-info-note focus-info-note--${tone} mb-0`}>
      <Icon name={tone === "caution" ? "alert" : "info"} size={14} />
      <span>{children}</span>
    </p>
  );
}
