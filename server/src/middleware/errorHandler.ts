import type { NextFunction, Request, Response } from "express";
import { AppError, type ErrorCode } from "../lib/AppError";
import { logger } from "../lib/logger";

export interface ApiErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    requestId: string;
  };
}

/** Terminal 404 handler. Mounted after all routes. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
}

/**
 * Central error handler. Every error response in the API has this shape.
 * Stack traces are logged server-side and never sent to the client.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : 500;
  const code: ErrorCode = isAppError ? err.code : "INTERNAL_ERROR";
  const message = isAppError ? err.message : "Something went wrong";

  logger.error("request failed", {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    status,
    code,
    detail: err instanceof Error ? err.message : String(err),
    stack: process.env.NODE_ENV === "production" ? undefined : (err as Error)?.stack,
  });

  const body: ApiErrorBody = {
    success: false,
    error: { code, message, requestId: req.requestId },
  };

  res.status(status).json(body);
}
