import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface BoardColumnProps {
  title: string;
  count: number;
  /** Called when a card is dropped on this column. */
  onDropCard: (cardId: string, targetIndex: number) => void;
  children: ReactNode;
}

/**
 * One column of a board, and the drop target for it.
 *
 * Shared by the project board and the cooking board — the two differ in what a
 * column *means*, not in how a column behaves.
 *
 * The drop indicator is deliberately loud while a drag is in progress and
 * invisible otherwise: a permanently outlined empty column reads as an error
 * state rather than as a place to put something.
 */
export function BoardColumn({ title, count, onDropCard, children }: BoardColumnProps) {
  const { t } = useTranslation(["projects", "common"]);
  const [isOver, setIsOver] = useState(false);

  return (
    <section
      className={`focus-board-column ${isOver ? "is-over" : ""}`}
      aria-label={`${title} (${count})`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const cardId = event.dataTransfer.getData("text/plain");
        if (cardId) onDropCard(cardId, -1);
      }}
    >
      <header className="focus-board-column__head">
        <h2 className="focus-board-column__title">{title}</h2>
        <span className="focus-board-column__count">{count}</span>
      </header>

      <div className="focus-board-column__body">
        {children}
        {count === 0 && <p className="focus-board-column__empty mb-0">{t("projects:columnEmpty")}</p>}
      </div>
    </section>
  );
}
