import { create } from "zustand";
import { Painting } from "../types/Painting";

interface PaintingStore {
  paintings: Painting[];
  setPaintings: (p: Painting[]) => void;
}

export const usePaintingStore = create<PaintingStore>((set) => ({
  paintings: [],
  setPaintings: (p) => set({ paintings: p }),
}));
