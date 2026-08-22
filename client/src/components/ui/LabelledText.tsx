import type { ReactNode } from "react";

interface LabelledTextProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * An interface label above a block of the user's own words.
 *
 * The two are separated on purpose. "Next action: Book the courtyard table"
 * on one line puts a Hebrew label and an English sentence in the same
 * bidirectional run, and the browser then has to guess where the punctuation
 * belongs — which it gets wrong often enough to matter. The label follows the
 * interface direction; the value gets its own `dir="auto"` block.
 */
export function LabelledText({ label, children, className }: LabelledTextProps) {
  return (
    <div className={`focus-labelled${className ? " " + className : ""}`}>
      <p className="focus-labelled__label">{label}</p>
      <div className="focus-labelled__value" dir="auto">
        {children}
      </div>
    </div>
  );
}
