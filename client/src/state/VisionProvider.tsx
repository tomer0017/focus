import { useCallback, useMemo, type ReactNode } from "react";
import { visionBoardsRepository, visionDailyRepository } from "../repositories";
import { todayKey } from "../lib/dateKey";
import type { VisionBoard, VisionTile } from "../types";
import { VisionContext, type NewVisionTile, type VisionContextValue } from "./visionContext";
import { usePersistentState } from "./usePersistentState";

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function renumber(tiles: VisionTile[]): VisionTile[] {
  return [...tiles]
    .sort((a, b) => a.order - b.order)
    .map((tile, index) => ({ ...tile, order: index }));
}

/**
 * Vision boards, and the once-a-day reminder preference.
 *
 * The preference is off by default and stores the last date it was shown, so
 * "once a day" is a fact about the calendar rather than about this tab.
 */
export function VisionProvider({ children }: { children: ReactNode }) {
  const [boards, setBoards] = usePersistentState(visionBoardsRepository);
  const [daily, setDaily] = usePersistentState(visionDailyRepository);

  const getBoard = useCallback((id: string) => boards.find((board) => board.id === id), [boards]);

  const patchBoard = useCallback(
    (boardId: string, updater: (board: VisionBoard) => VisionBoard) => {
      setBoards((current) => current.map((board) => (board.id === boardId ? updater(board) : board)));
    },
    [setBoards]
  );

  const createBoard = useCallback(
    (title: string, year: number): VisionBoard => {
      const board: VisionBoard = {
        id: newId("board"),
        title,
        year,
        tiles: [],
        createdAt: new Date().toISOString(),
      };
      setBoards((current) => [...current, board]);
      return board;
    },
    [setBoards]
  );

  const addTile = useCallback(
    (boardId: string, tile: NewVisionTile) => {
      patchBoard(boardId, (board) => ({
        ...board,
        tiles: renumber([...board.tiles, { ...tile, id: newId("tile"), order: board.tiles.length }]),
      }));
    },
    [patchBoard]
  );

  const removeTile = useCallback(
    (boardId: string, tileId: string) => {
      patchBoard(boardId, (board) => ({
        ...board,
        tiles: renumber(board.tiles.filter((tile) => tile.id !== tileId)),
      }));
    },
    [patchBoard]
  );

  const updateTile = useCallback(
    (boardId: string, tileId: string, patch: Partial<VisionTile>) => {
      patchBoard(boardId, (board) => ({
        ...board,
        tiles: board.tiles.map((tile) => (tile.id === tileId ? { ...tile, ...patch } : tile)),
      }));
    },
    [patchBoard]
  );

  const moveTileBy = useCallback(
    (boardId: string, tileId: string, direction: -1 | 1) => {
      patchBoard(boardId, (board) => {
        const ordered = renumber(board.tiles);
        const index = ordered.findIndex((tile) => tile.id === tileId);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= ordered.length) return board;

        const next = [...ordered];
        [next[index], next[target]] = [next[target], next[index]];
        return { ...board, tiles: next.map((tile, position) => ({ ...tile, order: position })) };
      });
    },
    [patchBoard]
  );

  const setDailyEnabled = useCallback(
    (enabled: boolean, boardId?: string) => {
      setDaily((current) => ({
        ...current,
        enabled,
        boardId: boardId ?? current.boardId,
      }));
    },
    [setDaily]
  );

  const markDailyShown = useCallback(() => {
    setDaily((current) => ({ ...current, lastShownDate: todayKey() }));
  }, [setDaily]);

  const value = useMemo<VisionContextValue>(
    () => ({
      boards,
      getBoard,
      createBoard,
      addTile,
      removeTile,
      updateTile,
      moveTileBy,
      daily,
      setDailyEnabled,
      markDailyShown,
    }),
    [
      boards,
      getBoard,
      createBoard,
      addTile,
      removeTile,
      updateTile,
      moveTileBy,
      daily,
      setDailyEnabled,
      markDailyShown,
    ]
  );

  return <VisionContext.Provider value={value}>{children}</VisionContext.Provider>;
}
