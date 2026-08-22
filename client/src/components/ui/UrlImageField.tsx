import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isImageUrl } from "../../lib/links";

export type UrlImageStatus = "empty" | "invalid" | "loading" | "ok" | "failed";

interface UrlImageFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Told whenever the address changes state, so a form can gate its submit. */
  onStatusChange?: (status: UrlImageStatus) => void;
}

/**
 * One field for "a picture that lives somewhere else".
 *
 * Shared by the vision board, trip covers, destinations and outfits: the rules
 * are identical everywhere and writing them four times would mean four
 * different ideas of what a broken address looks like.
 *
 * The preview *is* the validation — loading the address is the only honest test
 * that it points at an image. Nothing is fetched for metadata and nothing is
 * downloaded: only the address is ever stored.
 */
export function UrlImageField({
  id,
  label,
  hint,
  value,
  onChange,
  onStatusChange,
}: UrlImageFieldProps) {
  const { t } = useTranslation(["vision", "common"]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const trimmed = value.trim();
  const looksValid = isImageUrl(trimmed);

  const status: UrlImageStatus = !trimmed
    ? "empty"
    : !looksValid
      ? "invalid"
      : failed
        ? "failed"
        : loaded
          ? "ok"
          : "loading";

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [trimmed]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  return (
    <div className="focus-url-field">
      <label htmlFor={id} className="form-label fw-medium">
        {label}
      </label>
      <input
        id={id}
        type="url"
        dir="ltr"
        className={`form-control ${status === "invalid" || status === "failed" ? "is-invalid" : ""}`}
        placeholder="https://"
        value={value}
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={`${id}-hint`} className="form-text mb-2">
        {hint ?? t("vision:imageUrlHint")}
      </p>

      {status === "invalid" && (
        <p className="focus-inline-error" role="alert">
          {t("vision:imageUrlInvalid")}
        </p>
      )}
      {status === "failed" && (
        <p className="focus-inline-error" role="alert">
          {t("vision:imageLoadFailed")}
        </p>
      )}

      {looksValid && !failed && (
        <figure className="focus-url-preview">
          <img
            src={trimmed}
            alt=""
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
          <figcaption>{loaded ? t("vision:previewOk") : t("common:loading")}</figcaption>
        </figure>
      )}
    </div>
  );
}
