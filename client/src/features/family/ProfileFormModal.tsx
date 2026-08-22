import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { useFamily } from "../../state/familyContext";
import type { EventImportance, FamilyProfile, FamilyProfileType } from "../../types";

interface ProfileFormModalProps {
  show: boolean;
  onClose: () => void;
  profile?: FamilyProfile;
}

const TYPES: FamilyProfileType[] = ["adult", "child", "baby", "pet"];
const IMPORTANCE: EventImportance[] = ["low", "normal", "high"];

/**
 * Create or edit a profile.
 *
 * Only the name is required. Everything else — the relationship, the birth
 * date, the picture — is a thing you might know, and a form that insists on all
 * of them is a form nobody finishes.
 *
 * The birthday block appears only once a birth date is typed, because
 * "how long before the birthday should I start preparing?" is meaningless
 * without one.
 */
export function ProfileFormModal({ show, onClose, profile }: ProfileFormModalProps) {
  const { t } = useTranslation(["family", "common"]);
  const navigate = useNavigate();
  const { createProfile, updateProfile } = useFamily();

  const [name, setName] = useState("");
  const [type, setType] = useState<FamilyProfileType>("adult");
  const [relationship, setRelationship] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [species, setSpecies] = useState("");
  const [birthdayEnabled, setBirthdayEnabled] = useState(true);
  const [prepDays, setPrepDays] = useState("");
  const [importance, setImportance] = useState<EventImportance>("normal");

  useEffect(() => {
    if (!show) return;
    setName(profile?.name ?? "");
    setType(profile?.type ?? "adult");
    setRelationship(profile?.relationship ?? "");
    setBirthDate(profile?.birthDate ?? "");
    setPhotoUrl(profile?.photoUrl ?? "");
    setSpecies(profile?.species ?? "");
    setBirthdayEnabled(profile?.birthday?.enabled ?? true);
    setPrepDays(
      profile?.birthday?.prepDaysBefore !== undefined
        ? String(profile.birthday.prepDaysBefore)
        : ""
    );
    setImportance(profile?.birthday?.importance ?? "normal");
  }, [show, profile]);

  const canSave = name.trim().length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const draft = {
      name: name.trim(),
      type,
      relationship: relationship.trim() || undefined,
      birthDate: birthDate || undefined,
      photoUrl: photoUrl.trim() || undefined,
      species: species.trim() || undefined,
    };

    if (profile) {
      updateProfile(profile.id, {
        ...draft,
        birthday: {
          // Never enabled without a date: a countdown to nothing is worse than
          // no countdown.
          enabled: birthdayEnabled && Boolean(birthDate),
          prepDaysBefore: prepDays.trim() ? Number(prepDays) : undefined,
          importance,
        },
      });
      onClose();
      return;
    }

    const created = createProfile(draft);
    if (birthDate) {
      updateProfile(created.id, {
        birthday: {
          enabled: birthdayEnabled,
          prepDaysBefore: prepDays.trim() ? Number(prepDays) : undefined,
          importance,
        },
      });
    }
    onClose();
    navigate(`/family/${created.id}`);
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered size="lg">
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {profile ? t("family:editProfile") : t("family:addProfile")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div className="focus-field-row">
              <div>
                <label htmlFor="profile-name" className="form-label fw-medium">
                  {t("family:fields.name")}
                </label>
                <input
                  id="profile-name"
                  className="form-control"
                  dir="auto"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="profile-type" className="form-label fw-medium">
                  {t("family:fields.type")}
                </label>
                <select
                  id="profile-type"
                  className="form-select"
                  value={type}
                  onChange={(event) => setType(event.target.value as FamilyProfileType)}
                >
                  {TYPES.map((option) => (
                    <option key={option} value={option}>
                      {t(`family:types.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="profile-relationship" className="form-label fw-medium">
                  {t("family:fields.relationship")}
                </label>
                <input
                  id="profile-relationship"
                  className="form-control"
                  dir="auto"
                  placeholder={t("family:fields.relationshipPlaceholder")}
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value)}
                />
              </div>
              {type === "pet" && (
                <div>
                  <label htmlFor="profile-species" className="form-label fw-medium">
                    {t("family:fields.species")}
                  </label>
                  <input
                    id="profile-species"
                    className="form-control"
                    dir="auto"
                    value={species}
                    onChange={(event) => setSpecies(event.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="profile-birth" className="form-label fw-medium">
                {t("family:fields.birthDate")}
              </label>
              <input
                id="profile-birth"
                type="date"
                className="form-control"
                dir="ltr"
                value={birthDate}
                aria-describedby="profile-birth-hint"
                onChange={(event) => setBirthDate(event.target.value)}
              />
              <p id="profile-birth-hint" className="form-text mb-0">
                {t("family:fields.birthDateHint")}
              </p>
            </div>

            {birthDate && (
              <fieldset className="focus-form-stack">
                <legend className="form-label fw-medium">{t("family:birthday.title")}</legend>

                <div className="form-check">
                  <input
                    id="profile-bday-on"
                    type="checkbox"
                    className="form-check-input"
                    checked={birthdayEnabled}
                    onChange={(event) => setBirthdayEnabled(event.target.checked)}
                  />
                  <label htmlFor="profile-bday-on" className="form-check-label">
                    {t("family:birthday.enabled")}
                  </label>
                </div>

                {birthdayEnabled && (
                  <div className="focus-field-row">
                    <div>
                      <label htmlFor="profile-prep" className="form-label fw-medium">
                        {t("family:birthday.prepDaysBefore")}
                      </label>
                      <input
                        id="profile-prep"
                        type="number"
                        min={0}
                        max={365}
                        className="form-control"
                        dir="ltr"
                        value={prepDays}
                        aria-describedby="profile-prep-hint"
                        onChange={(event) => setPrepDays(event.target.value)}
                      />
                      <p id="profile-prep-hint" className="form-text mb-0">
                        {t("family:birthday.prepHint")}
                      </p>
                    </div>
                    <div>
                      <label htmlFor="profile-importance" className="form-label fw-medium">
                        {t("family:birthday.importance")}
                      </label>
                      <select
                        id="profile-importance"
                        className="form-select"
                        value={importance}
                        onChange={(event) => setImportance(event.target.value as EventImportance)}
                      >
                        {IMPORTANCE.map((option) => (
                          <option key={option} value={option}>
                            {t(`family:importance.${option}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </fieldset>
            )}

            <UrlImageField
              id="profile-photo"
              label={t("family:fields.photoUrl")}
              hint={t("family:fields.photoHint")}
              value={photoUrl}
              onChange={setPhotoUrl}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSave}>
            {profile ? t("common:actions.save") : t("common:actions.create")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
