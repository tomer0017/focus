/** Stable, client-safe error codes. Keep this list short and meaningful. */
export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

/**
 * An error that is safe to surface to the client.
 * Anything thrown that is NOT an AppError is treated as INTERNAL_ERROR and its
 * message is never forwarded to the client.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;

  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }

  static badRequest(message = "Invalid request"): AppError {
    return new AppError(400, "BAD_REQUEST", message);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(404, "NOT_FOUND", message);
  }
}
