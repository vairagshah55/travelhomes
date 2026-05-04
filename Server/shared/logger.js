/**
 * Structured logger built on pino.
 *
 * - Pretty-prints in dev (via pino-pretty).
 * - Emits JSON in production (one event per line).
 * - Redacts authorization headers and password / token fields by default.
 *
 * Usage:
 *   const logger = require("../shared/logger");
 *   logger.info({ userId }, "user signed in");
 *   logger.error({ err }, "failed to send email");
 *
 * Per-request logger: `req.log` (added by pino-http) is auto-bound with
 * the request id and method/path.
 */
const pino = require("pino");
const env = require("../config/env");

const isDev = env.NODE_ENV !== "production";

const logger = pino({
  level: isDev ? "debug" : "info",
  base: { service: "travelhomes-server", env: env.NODE_ENV },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.otp",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss.l",
        ignore: "pid,hostname,service,env",
        singleLine: false,
      },
    },
  }),
});

module.exports = logger;
