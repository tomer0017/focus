import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

interface TokenListFieldProps {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  /** `time` renders a clock picker — used for medication doses. */
  inputType?: "text" | "time";
  /** How a value is announced in its remove button. */
  removeLabel: (value: string) => string;
}

/**
 * A short list the user builds one entry at a time: tags, or times of day.
 *
 * Enter adds, and so does an explicit button — a form where the only way to
 * commit a value is a key press loses that value silently when somebody presses
 * Save instead, which is the most annoying possible way to lose typing.
 * Duplicates are dropped rather than rejected with an error; adding "08:00"
 * twice is a slip, not a mistake worth a message.
 */
export function TokenListField({
  label,
  hint,
  values,
  onChange,
  placeholder,
  inputType = "text",
  removeLabel,
}: TokenListFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const [draft, setDraft] = useState("");

  const add = (): void => {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...values, trimmed]);
    setDraft("");
  };

  return (
    <div>
      <label htmlFor={id} className="form-label fw-medium">
        {label}
      </label>

      {values.length > 0 && (
        <ul className="focus-token-list list-unstyled mb-2">
          {values.map((value) => (
            <li key={value} className="focus-token">
              <span dir={inputType === "time" ? "ltr" : "auto"}>{value}</span>
              <button
                type="button"
                aria-label={removeLabel(value)}
                onClick={() => onChange(values.filter((entry) => entry !== value))}
              >
                <Icon name="trash" size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="d-flex gap-2">
        <input
          id={id}
          type={inputType}
          className="form-control"
          dir={inputType === "time" ? "ltr" : "auto"}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            // Otherwise Enter submits the surrounding form instead of adding.
            event.preventDefault();
            add();
          }}
        />
        <button type="button" className="btn btn-outline-secondary text-nowrap" onClick={add}>
          {t("actions.add")}
        </button>
      </div>

      {hint && <p className="form-text mb-0">{hint}</p>}
    </div>
  );
}
