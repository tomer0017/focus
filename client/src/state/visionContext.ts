import { createContext, useContext } from "react";
import type { VisionBoard, VisionDailyPreference, VisionTile } from "../types";

export type NewVisionTile = Pick<VisionTile, "caption" | "category" | "size"> &
  Partial<Pick<VisionTile, "thumb" | "imageUrl" | "savedItemId" | "linkedPageId">>;

export interface VisionContextValue {
  boards: VisionBoard[];
  getBoard: (id: string) => VisionBoard | undefined;
  createBoard: (title: string, year: number) => VisionBoard;
  addTile: (boardId: string, tile: NewVisionTile) => void;
  removeTile: (boardId: string, tileId: string) => void;
  /** Edits a tile in place — the picture, its caption, category or size. */
  updateTile: (boardId: string, tileId: string, patch: Partial<VisionTile>) => void;
  /** -1 moves a tile earlier in the collage, 1 later. */
  moveTileBy: (boardId: string, tileId: string, direction: -1 | 1) => void;

  daily: VisionDailyPreference;
  setDailyEnabled: (enabled: boolean, boardId?: string) => void;
  /** Records that today's showing happened, so it does not happen twice. */
  markDailyShown: () => void;
}

export const VisionContext = createContext<VisionContextValue | null>(null);

export function useVision(): VisionContextValue {
  const value = useContext(VisionContext);
  if (!value) {
    throw new Error("useVision must be used inside <VisionProvider>");
  }
  return value;
}
