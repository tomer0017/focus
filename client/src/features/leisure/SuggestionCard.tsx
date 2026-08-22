import { useState } from "react";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { InfoNote } from "../../components/ui/InfoNote";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import { DISMISS_HOURS, type Suggestion } from "../../lib/leisureRules";
import { useLeisure } from "../../state/leisureContext";
import type { LeisureCompany, LeisureContext, LeisureEnergy, LeisurePlace } from "../../types";

/** How long "stop suggesting for a while" lasts. A week, then it comes back. */
const MUTE_HOURS = 24 * 7;

/**
 * "What suits right now?" — five optional inputs and exactly one answer.
 *
 * Three properties matter more than the scoring:
 *
 * - **It never pops up.** It is a calm card that sits where it is put. There is
 *   no modal, no toast and no daily prompt.
 * - **It can answer "nothing".** If nothing on the list fits ninety minutes at
 *   home with no energy, it says so instead of offering something that doesn't.
 * - **It remembers.** Accepting, dismissing and simply being offered all leave
 *   a mark, so the same film cannot be suggested every evening for a week.
 */
export function SuggestionCard() {
  const { t } = useTranslation(["leisure", "common"]);
  const { locale } = useLocale();
  const { suggest, acceptItem, dismissItem, preference, setPreference } = useLeisure();

  const [minutes, setMinutes] = useState<string>("");
  const [energy, setEnergy] = useState<LeisureEnergy | "">("");
  const [company, setCompany] = useState<LeisureCompany | "">("");
  const [place, setPlace] = useState<LeisurePlace | "">("");
  const [load, setLoad] = useState<LeisureContext["load"] | "">("");
  const [asked, setAsked] = useState(false);
  const [result, setResult] = useState<Suggestion | undefined>(undefined);

  const muted = Boolean(preference.mutedUntil && preference.mutedUntil > new Date().toISOString());

  const ask = (): void => {
    const context: LeisureContext = {
      minutes: minutes ? Number(minutes) : undefined,
      energy: energy || undefined,
      company: company || undefined,
      place: place || undefined,
      load: load || undefined,
    };
    setResult(suggest(context));
    setAsked(true);
  };

  if (muted) {
    return (
      <div className="focus-panel">
        <h2 className="focus-panel__title">{t("leisure:suggest.title")}</h2>
        <p className="focus-panel__lead">
          {t("leisure:suggest.muted", {
            when: formatRelativeDay(preference.mutedUntil!, locale),
          })}
        </p>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setPreference({ mutedUntil: null })}
        >
          {t("leisure:suggest.unmute")}
        </Button>
      </div>
    );
  }

  return (
    <div className="focus-panel">
      <h2 className="focus-panel__title">{t("leisure:suggest.title")}</h2>
      <p className="focus-panel__lead">{t("leisure:suggest.lead")}</p>

      <div className="focus-field-row mb-2">
        <div>
          <label htmlFor="sug-minutes" className="form-label fw-medium">
            {t("leisure:suggest.minutes")}
          </label>
          <select
            id="sug-minutes"
            className="form-select form-select-sm"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          >
            <option value="">{t("leisure:suggest.minutesAny")}</option>
            <option value="30">30</option>
            <option value="60">60</option>
            <option value="90">90</option>
            <option value="120">120</option>
            <option value="240">240</option>
          </select>
        </div>

        <div>
          <label htmlFor="sug-energy" className="form-label fw-medium">
            {t("leisure:suggest.energy")}
          </label>
          <select
            id="sug-energy"
            className="form-select form-select-sm"
            value={energy}
            onChange={(event) => setEnergy(event.target.value as LeisureEnergy | "")}
          >
            <option value="">{t("leisure:suggest.energyAny")}</option>
            <option value="low">{t("leisure:energy.low")}</option>
            <option value="medium">{t("leisure:energy.medium")}</option>
            <option value="high">{t("leisure:energy.high")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="sug-company" className="form-label fw-medium">
            {t("leisure:suggest.company")}
          </label>
          <select
            id="sug-company"
            className="form-select form-select-sm"
            value={company}
            onChange={(event) => setCompany(event.target.value as LeisureCompany | "")}
          >
            <option value="">{t("leisure:suggest.companyAny")}</option>
            <option value="alone">{t("leisure:company.alone")}</option>
            <option value="partner">{t("leisure:company.partner")}</option>
            <option value="family">{t("leisure:company.family")}</option>
            <option value="friends">{t("leisure:company.friends")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="sug-place" className="form-label fw-medium">
            {t("leisure:suggest.place")}
          </label>
          <select
            id="sug-place"
            className="form-select form-select-sm"
            value={place}
            onChange={(event) => setPlace(event.target.value as LeisurePlace | "")}
          >
            <option value="">{t("leisure:suggest.placeAny")}</option>
            <option value="home">{t("leisure:place.home")}</option>
            <option value="out">{t("leisure:place.out")}</option>
          </select>
        </div>

        <div>
          <label htmlFor="sug-load" className="form-label fw-medium">
            {t("leisure:suggest.load")}
          </label>
          <select
            id="sug-load"
            className="form-select form-select-sm"
            value={load}
            onChange={(event) => setLoad(event.target.value as LeisureContext["load"] | "")}
          >
            <option value="">{t("leisure:suggest.energyAny")}</option>
            <option value="busy">{t("leisure:suggest.loadBusy")}</option>
            <option value="normal">{t("leisure:suggest.loadNormal")}</option>
            <option value="free">{t("leisure:suggest.loadFree")}</option>
          </select>
        </div>
      </div>

      <div className="focus-suggestion__actions mb-2">
        <Button variant="primary" size="sm" onClick={ask}>
          {asked ? t("leisure:suggest.again") : t("leisure:suggest.ask")}
        </Button>
        <Button
          variant="link"
          size="sm"
          className="text-decoration-none"
          onClick={() =>
            setPreference({
              mutedUntil: new Date(Date.now() + MUTE_HOURS * 3600_000).toISOString(),
            })
          }
        >
          {t("leisure:suggest.mute")}
        </Button>
      </div>

      {asked && !result && (
        <div className="focus-suggestion">
          <p className="focus-suggestion__title">
            {load === "busy" ? t("leisure:suggest.busyHint") : t("leisure:suggest.nothing")}
          </p>
          {load !== "busy" && (
            <p className="focus-suggestion__why">{t("leisure:suggest.nothingHint")}</p>
          )}
        </div>
      )}

      {result && (
        <div className="focus-suggestion">
          <p className="focus-dense-row__eyebrow">{t(`leisure:kinds.${result.item.kind}`)}</p>
          <p className="focus-suggestion__title" dir="auto">
            {result.item.title}
          </p>
          {result.reasons.length > 0 && (
            <p className="focus-suggestion__why">
              {t("leisure:suggest.why")}:{" "}
              {result.reasons.map((reason) => t(`leisure:suggest.reasons.${reason}`)).join(" · ")}
            </p>
          )}
          <div className="focus-suggestion__actions">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                acceptItem(result.item.id);
                setResult(undefined);
                setAsked(false);
              }}
            >
              {t("leisure:suggest.accept")}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={ask}>
              {t("leisure:suggest.again")}
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                dismissItem(result.item.id, DISMISS_HOURS);
                setResult(undefined);
              }}
            >
              {t("leisure:suggest.notNow")}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2">
        <InfoNote>{t("leisure:suggest.noAi")}</InfoNote>
      </div>
    </div>
  );
}
