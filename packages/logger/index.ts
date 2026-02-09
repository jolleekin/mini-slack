import pino, { Logger, LoggerOptions } from "pino";

export interface LogContext {
  trace_id?: string;
  user_id?: string;
  workspace_id?: string;
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === "production";

const pinoOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

if (!isProduction) {
  pinoOptions.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    },
  };
}

/**
 * The logger singleton.
 */
export const logger: Logger = pino(pinoOptions);
