import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { logger } from "./lib/logger";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  logger.info("server started", { port: PORT, env: process.env.NODE_ENV || "development" });
});

// Never let an unhandled failure leave the process in an unknown state silently.
process.on("unhandledRejection", (reason) => {
  logger.error("unhandled rejection", { detail: String(reason) });
});

process.on("uncaughtException", (error: Error) => {
  logger.error("uncaught exception", { detail: error.message, stack: error.stack });
  server.close(() => process.exit(1));
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    logger.info("shutting down", { signal });
    server.close(() => process.exit(0));
  });
}
