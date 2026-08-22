type LogLevel = "info" | "warn" | "error";

interface LogFields {
  [key: string]: unknown;
}

/**
 * Deliberately tiny, centralised logger.
 * A real logging library (pino/winston) is only worth adding once we ship
 * something that actually consumes structured logs. See CLAUDE.md.
 */
function write(level: LogLevel, message: string, fields: LogFields = {}): void {
  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...fields,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
};
