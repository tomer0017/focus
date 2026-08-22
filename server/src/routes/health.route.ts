import express, { type Request, type Response } from "express";

const router = express.Router();

const startedAt = Date.now();

/**
 * GET /health
 * Liveness probe. Intentionally free of any database or auth dependency so it
 * stays truthful about the process itself.
 */
router.get("/health", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "focus-server",
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  });
});

export default router;
