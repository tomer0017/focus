import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { UrlImageField } from "../../components/ui/UrlImageField";
import { LEARNING_LEVELS, topicLabel } from "../../lib/learning";
import { usePages } from "../../state/pagesContext";
import type { LearningLevel } from "../../types";

/** The value that turns the subject picker into a "name a new one" field. */
const NEW_TOPIC = "__new";

/**
 * A new learning page.
 *
 * One required field — what you are learning — and four optional ones. Nothing
 * is created behind the user's back: **no template, no starter checklist and no
 * seeded notes.** The screen this replaces offered the app-wide checklist
 * picker, so starting to learn English could produce a weekly supermarket list
 * of fruit, dairy and bakery. The right answer was not a better picker: an
 * empty page the user fills is honest, and a page that arrives holding somebody
 * else's content is not. Note starting points are offered later, on the page,
 * at the moment a note is actually being written.
 *
 * There is no space picker either. Somebody inside the learning area has
 * already said what kind of thing they are making.
 */
export function NewLearningModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { t } = useTranslation(["pages", "common"]);
  const navigate = useNavigate();
  const { createPage, learningTopics, addLearningTopic } = usePages();

  const [title, setTitle] = useState("");
  const [topicId, setTopicId] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [level, setLevel] = useState<LearningLevel | "">("");
  const [goal, setGoal] = useState("");
  const [method, setMethod] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!show) return;
    // Cancelling and reopening starts clean: nothing is kept, and nothing was
    // written on the way out.
    setTitle("");
    setTopicId("");
    setNewTopic("");
    setLevel("");
    setGoal("");
    setMethod("");
    setImageUrl("");
  }, [show]);

  const canSave = title.trim().length > 0;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!canSave) return;

    let categoryId: string | undefined;
    if (topicId === NEW_TOPIC) {
      const name = newTopic.trim();
      categoryId = name ? addLearningTopic(name).id : undefined;
    } else {
      categoryId = topicId || undefined;
    }

    const page = createPage({
      type: "learning",
      spaceId: "personal",
      title: title.trim(),
      categoryId,
      visionImageUrl: imageUrl.trim() || undefined,
      learning: {
        level: level || undefined,
        goal: goal.trim() || undefined,
        method: method.trim() || undefined,
      },
    });

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
                <label htmlFor="learn-topic" className="form-label fw-medium">
                  {t("pages:learning.topic")}
                </label>
                <select
                  id="learn-topic"
                  className="form-select"
                  value={topicId}
                  onChange={(event) => setTopicId(event.target.value)}
                >
                  <option value="">{t("pages:learning.topics.none")}</option>
                  {learningTopics.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {topicLabel(learningTopics, entry.id, t) ?? entry.id}
                    </option>
                  ))}
                  <option value={NEW_TOPIC}>{t("pages:learning.topics.add")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="learn-level" className="form-label fw-medium">
                  {t("pages:learning.level")}
                </label>
                <select
                  id="learn-level"
                  className="form-select"
                  value={level}
                  onChange={(event) => setLevel(event.target.value as LearningLevel | "")}
                >
                  {/* Unset is a real answer. Guessing "beginner" for somebody
                      who has been at this for two years is inventing a fact. */}
                  <option value="">{t("pages:learning.levels.unset")}</option>
                  {LEARNING_LEVELS.map((option) => (
                    <option key={option} value={option}>
                      {t(`pages:learning.levels.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {topicId === NEW_TOPIC && (
              <div>
                <label htmlFor="learn-new-topic" className="form-label fw-medium">
                  {t("pages:learning.topics.newName")}
                </label>
                <input
                  id="learn-new-topic"
                  className="form-control"
                  dir="auto"
                  value={newTopic}
                  onChange={(event) => setNewTopic(event.target.value)}
                />
              </div>
            )}

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

            <UrlImageField
              id="learn-image"
              label={t("pages:learning.image")}
              hint={t("pages:learning.imageHint")}
              value={imageUrl}
              onChange={setImageUrl}
            />
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
