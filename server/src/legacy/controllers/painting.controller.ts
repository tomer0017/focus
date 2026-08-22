import { Request, Response } from "express";
import Painting from "../models/painting";

interface AuthRequest extends Request {
  userId?: string;
}

export const getMyPaintings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const paintings = await Painting.find({ user: userId });
    res.json(paintings);
  } catch (err) {
    console.error("שגיאה בשליפת הציורים:", err);
    res.status(500).json({ message: "שגיאה בטעינת הציורים" });
  }
};

export async function getUserPaintings(req: AuthRequest, res: Response) {
  const paintings = await Painting.find({ userId: req.userId });
  res.json(paintings);
}

export async function createPainting(req: AuthRequest, res: Response) {
  const newPainting = new Painting({ ...req.body, userId: req.userId });
  const saved = await newPainting.save();
  res.status(201).json(saved);
}

export async function deletePainting(req: AuthRequest, res: Response) {
  const result = await Painting.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!result) return res.status(404).json({ message: "Not found" });
  res.json({ message: "Deleted" });
}
