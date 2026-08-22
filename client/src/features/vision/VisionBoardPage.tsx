import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { useVision } from "../../state/visionContext";
import { usePages } from "../../state/pagesContext";
import { Icon } from "../../components/ui/Icon";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageHeader } from "../../components/ui/PageHeader";
import { VisionTileCard } from "./VisionTileCard";
import { TileFormModal } from "./TileFormModal";

/**
 * The vision board: a collage, not a canvas.
 *
 * There is no free positioning, no layers and no rotation. Three tile sizes and
 * an order are enough to make a board that feels personal, and everything
 * beyond that turns a two-minute ritual into a design task.
 */
export function VisionBoardPage() {
  const { t } = useTranslation(["vision", "common"]);
  const { boards, addTile, removeTile, updateTile, moveTileBy, daily, setDailyEnabled, createBoard } =
    useVision();
  const { savedItems } = usePages();

  const [boardId, setBoardId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingTileId, setEditingTileId] = useState<string | null>(null);

  const board = boards.find((entry) => entry.id === boardId) ?? boards[0];
  const tiles = useMemo(
    () => (board ? [...board.tiles].sort((a, b) => a.order - b.order) : []),
    [board]
  );

  if (!board) {
    return (
      <>
        <PageHeader title={t("vision:title")} />
        <EmptyState
          title={t("vision:empty.title")}
          hint={t("vision:empty.hint")}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => createBoard(String(new Date().getFullYear()), new Date().getFullYear())}
            >
              <Icon name="plus" size={15} />
              {t("vision:createBoard")}
            </Button>
          }
        />
      </>
    );
  }

  const dailyOn = daily.enabled && daily.boardId === board.id;

  return (
    <>
      <PageHeader
        title={board.title}
        titleIsUserContent
        action={
          <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
            <Icon name="plus" size={15} />
            {t("vision:addTile")}
          </Button>
        }
      />

      {boards.length > 1 && (
        <div className="focus-pills" role="tablist" aria-label={t("vision:chooseBoard")}>
          {boards.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={board.id === entry.id}
              className={`focus-pills__item ${board.id === entry.id ? "is-active" : ""}`}
              onClick={() => setBoardId(entry.id)}
              dir="auto"
            >
              {entry.title}
            </button>
          ))}
        </div>
      )}

      <div className="focus-daily-toggle form-check form-switch">
        <input
          id="vision-daily"
          type="checkbox"
          role="switch"
          className="form-check-input"
          checked={dailyOn}
          onChange={(event) => setDailyEnabled(event.target.checked, board.id)}
        />
        <label htmlFor="vision-daily" className="form-check-label">
          {t("vision:dailyToggle")}
        </label>
        <p className="form-text mb-0">{t("vision:dailyHint")}</p>
      </div>

      {tiles.length === 0 ? (
        <EmptyState title={t("vision:emptyBoard.title")} hint={t("vision:emptyBoard.hint")} />
      ) : (
        /* One surface, not a row of cards: the frame belongs to the board. */
        <div className="focus-board-surface">
          <div className="focus-collage">
            {tiles.map((tile, index) => (
              <VisionTileCard
                key={tile.id}
                tile={tile}
                isFirst={index === 0}
                isLast={index === tiles.length - 1}
                onMove={(direction) => moveTileBy(board.id, tile.id, direction)}
                onEdit={() => setEditingTileId(tile.id)}
                onRemove={() => removeTile(board.id, tile.id)}
              />
            ))}
          </div>
        </div>
      )}

      <TileFormModal
        show={adding}
        savedItems={savedItems}
        onClose={() => setAdding(false)}
        onSubmit={(tile) => addTile(board.id, tile)}
      />

      <TileFormModal
        show={editingTileId !== null}
        tile={tiles.find((tile) => tile.id === editingTileId)}
        savedItems={savedItems}
        onClose={() => setEditingTileId(null)}
        onSubmit={(patch) => {
          if (editingTileId) updateTile(board.id, editingTileId, patch);
        }}
      />
    </>
  );
}
