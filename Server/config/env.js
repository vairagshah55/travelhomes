/**
 * Centralised, validated environment configuration.
 *
 * Loaded once at boot. Every other module reads env via `require('./env')`
 * instead of `process.env.X` — that way a missing or malformed value fails
 * the process at startup, not at the first request.
 *
 * Phase 1: covers the values used in middleware, auth, and bootstrap.
 * Phase 2 will migrate the remaining call sites (mailer, razorpay, twilio).
 */
const path = require("path");
const { z } = require("zod");

// Resolve the right .env file based on NODE_ENV before zod parses anything.
// Server/.env (this file lives in Server/config/, so '..' resolves to Server/).
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
require("dotenv").config({ path: path.join(__dirname, "..", envFile) });

const booleanish = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0", ""])])
  .transform((v) => v === true || v === "true" || v === "1")
  .default(false);

const port = z.coerce.number().int().positive().max(65535);

const url = z.string().url();
const urlOptional = z
  .string()
  .url()
  .optional()
  .or(z.literal("").transform(() => undefined));

const schema = z.object({
  // App
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  PORT: port.default(3001),

  // Database
  MONGO_URI: z
    .string()
    .min(1, "MONGO_URI is required")
    .refine((v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"), {
      message: "MONGO_URI must start with mongodb:// or mongodb+srv://",
    })
    .or(z.string().min(1)) // accept legacy MONGODB_URI fallback applied below
    .optional(),
  MONGODB_URI: z.string().min(1).optional(),
  MONGO_DB_NAME: z.string().optional(),

  // Auth — strict requirements (Phase 0)
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars"),
  JWT_SECRET_FOR_VERIFY: z.string().min(32, "JWT_SECRET_FOR_VERIFY must be at least 32 chars"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),

  // URLs
  FRONTEND_URL: url.default("http://localhost:8080"),
  ADMIN_URL: urlOptional,
  STORE_URL: urlOptional,

  // Google OAuth — optional, warn at boot if missing in non-dev (handled below).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: urlOptional,
  GOOGLE_CALLBACK_URL: urlOptional,

  // Razorpay
  RAZOR_KEY: z.string().optional(),
  RAZOR_SECRET: z.string().optional(),

  // Twilio
  TWILIO_SID: z.string().optional(),
  TWILIO_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Email (multiple aliases — picked up by various callers; Phase 2 unifies these)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_SECURE: booleanish,
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().max(65535).optional(),
  MAIL_USERNAME: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM_ADDRESS: z.string().optional(),
  MAIL_ENCRYPTION: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().int().positive().max(65535).optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  EMAIL_SENDER: z.string().optional(),

  // Marketing
  FB_PAGE_ACCESS_TOKEN: z.string().optional(),

  // Debug toggles
  LOG_AUTH_DEBUG: booleanish,
  LOG_OTP_DEBUG: booleanish,
});

let env;
try {
  env = schema.parse(process.env);
} catch (err) {
  if (err && err.issues) {
    const lines = err.issues.map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`);

    console.error(
      "\n[env] Invalid or missing environment variables:\n" +
        lines.join("\n") +
        "\n\nFix your .env file (see Server/.env.example) and restart.\n",
    );
  } else {
    console.error("[env] Failed to load environment:", err);
  }
  process.exit(1);
}

// Cross-field defaults: collapse the MongoDB alias.
const mongoUri = env.MONGO_URI || env.MONGODB_URI;
if (!mongoUri) {
  console.error("[env] Missing MONGO_URI (or MONGODB_URI). Set one in .env.");
  process.exit(1);
}
env.MONGO_URI = mongoUri;

// Soft warnings for production (non-fatal but loud).
if (env.NODE_ENV === "production") {
  const warnings = [];
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    warnings.push("Google OAuth env vars missing — login via Google will fail.");
  }
  if (!env.RAZOR_KEY || !env.RAZOR_SECRET) {
    warnings.push("Razorpay env vars missing — payments will fail.");
  }
  if (!env.SMTP_HOST && !env.MAIL_HOST && !env.EMAIL_HOST) {
    warnings.push("No SMTP/MAIL/EMAIL host configured — emails will fail.");
  }
  if (warnings.length) {
    console.warn(
      "\n[env] Production warnings:\n" + warnings.map((w) => "  • " + w).join("\n") + "\n",
    );
  }
}

module.exports = env;
