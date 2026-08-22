import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Correlation id for this request. Always present. */
      requestId: string;
    }
  }
}

/**
 * Attaches a correlation id to every request and echoes it back on the
 * response, so a client-side error report can be matched to a server log line.
 * Honours an inbound `x-request-id` when a proxy already set one.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const inbound = req.header("x-request-id");
  req.requestId = inbound && inbound.length <= 100 ? inbound : randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
}
