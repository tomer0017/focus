import express from "express";
import { login, register } from "../controllers/auth.controller";
import { authMiddleware, verifyToken } from "../middleware/authMiddleware";
import { createPainting, deletePainting, getMyPaintings, getUserPaintings } from "../controllers/painting.controller";


const router = express.Router();

// 🔐 התחברות
router.post("/api/auth/login", login);
router.post("/api/auth/register", register);


// 🎨 ציורים
router.get("/api/paintings/me", verifyToken, getMyPaintings);
router.get("/api/paintings", authMiddleware, getUserPaintings);
router.post("/api/paintings", authMiddleware, createPainting);
router.delete("/api/paintings/:id", authMiddleware, deletePainting);



export default router;