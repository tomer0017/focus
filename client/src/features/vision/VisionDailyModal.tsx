import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useVision } from "../../state/visionContext";
import { BoardImage } from "../../components/ui/BoardImage";
import { todayKey } from "../../lib/dateKey";

/**
 * The once-a-day board.
 *
 * Three rules keep it from becoming an interruption: it is off until the user
 * turns it on, it appears at most once per calendar day (recorded as a date, so
 * a new tab does not re-trigger it), and it never appears for an empty board.
 * "Do not show again" turns the whole thing off rather than snoozing it.
 */
export function VisionDailyModal() {
  const { t } = useTranslation(["vision", "common"]);
  const { boards, daily, markDailyShown, setDailyEnabled } = useVision();

  const board = boards.find((entry) => entry.id === daily.boardId);
  const eligible =
    daily.enabled &&
    Boolean(board) &&
    (board?.tiles.length ?? 0) > 0 &&
    daily.lastShownDate !== todayKey();

  /*
   * Openness is held here rather than derived from the preference, because
   * recording "shown today" immediately makes the condition false. The ref
   * makes the decision exactly once per session.
   */
  const [open, setOpen] = useState(false);
  const decided = useRef(false);

  useEffect(() => {
    if (decided.current || !eligible) return;
    decided.current = true;
    setOpen(true);
    // Recorded on open, not on close: closing the tab is not a reason to see it twice.
    markDailyShown();
  }, [eligible, markDailyShown]);

  if (!open || !board) return null;

  const close = (): void => setOpen(false);

  const tiles = [...board.tiles].sort((a, b) => a.order - b.order).slice(0, 9);

  return (
    <Modal show centered size="lg" onHide={close} scrollable>
      <Modal.Header closeButton closeLabel={t("common:actions.close")}>
        <Modal.Title as="h2" className="h5" dir="auto">
          {board.title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="focus-board-surface">
          <div className="focus-collage focus-collage--compact">
            {tiles.map((tile) => (
              <figure key={tile.id} className={`focus-tile-card focus-tile-card--${tile.size}`}>
                <BoardImage
                  className="focus-tile-card__image"
                  imageUrl={tile.imageUrl}
                  thumb={tile.thumb}
                />
                {tile.caption && (
                  <figcaption className="focus-tile-card__caption is-always">
                    <span className="focus-tile-card__text" dir="auto">
                      {tile.caption}
                    </span>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="justify-content-between">
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            setDailyEnabled(false);
            close();
          }}
        >
          {t("vision:dontShowAgain")}
        </Button>
        <div className="d-flex gap-2">
          <Link to="/vision" className="btn btn-outline-secondary btn-sm" onClick={close}>
            {t("vision:openBoard")}
          </Link>
          <Button variant="primary" size="sm" onClick={close}>
            {t("common:actions.close")}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
