import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { SPACES } from "../../mocks/spaces";
import { usePages } from "../../state/pagesContext";
import type { LearningLevel, SpaceId } from "../../types";

const LEVELS: LearningLevel[] = ["beginner", "intermediate", "advanced"];

/**
 * A new learning page.
 *
 * Four fields, none of them a curriculum. What is being learned, roughly where
 * you are, what you want to be able to do, and how you are going about it —
 * everything after that is an ordinary note, checklist or saved link on the
 * page itself.
 */
export function NewLearningModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { t } = useTranslation(["pages", "common"]);
  const navigate = useNavigate();
  const { createPage, setLearning } = usePages();

  const [title, setTitle] = useState("");
  const [spaceId, setSpaceId] = useState<SpaceId>("personal");
  const [level, setLevel] = useState<LearningLevel>("beginner");
  const [goal, setGoal] = useState("");
  const [method, setMethod] = useState("");

  useEffect(() => {
    if (!show) return;
    setTitle("");
    setSpaceId("personal");
    setLevel("beginner");
    setGoal("");
    setMethod("");
  }, [show]);

  const canSave = title.trim().length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    const page = createPage({
      type: "learning",
      spaceId,
      title: title.trim(),
      learning: {
        level,
        goal: goal.trim() || undefined,
        method: method.trim() || undefined,
      },
    });
    // `createPage` writes the facts onto the page itself; this stamps the
    // override too, so an immediate edit has somewhere to merge into.
    setLearning(page.id, { level });

    onClose();
    navigate(`/pages/${page.id}`);
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered>
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {t("pages:learning.add")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div>
              <label htmlFor="learn-title" className="form-label fw-medium">
                {t("pages:learning.titleField")}
              </label>
              <input
                id="learn-title"
                className="form-control"
                dir="auto"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="learn-level" className="form-label fw-medium">
                  {t("pages:learning.level")}
                </label>
                <select
                  id="learn-level"
                  className="form-select"
                  value={level}
                  onChange={(event) => setLevel(event.target.value as LearningLevel)}
                >
                  {LEVELS.map((option) => (
                    <option key={option} value={option}>
                      {t(`pages:learning.levels.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="learn-space" className="form-label fw-medium">
                  {t("common:nav.sectionLabel")}
                </label>
                <select
                  id="learn-space"
                  className="form-select"
                  value={spaceId}
                  onChange={(event) => setSpaceId(event.target.value as SpaceId)}
                >
                  {SPACES.map((space) => (
                    <option key={space.id} value={space.id}>
                      {t(`common:spaces.${space.id}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="learn-goal" className="form-label fw-medium">
                {t("pages:learning.goal")}
              </label>
              <input
                id="learn-goal"
                className="form-control"
                dir="auto"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="learn-method" className="form-label fw-medium">
                {t("pages:learning.method")}
              </label>
              <input
                id="learn-method"
                className="form-control"
                dir="auto"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit" disabled={!canSave}>
            {t("common:actions.create")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
