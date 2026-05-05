const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// The onboarding bodies are the largest free-form content payloads in the
// app — the SPA wizard sends ~60 fields per type, with nested rooms /
// rules / features arrays. We .passthrough() to avoid dropping fields
// the model still accepts; the underlying mongoose schema is the
// schema-of-record.
const submitBody = z.object({}).passthrough();

const selfieBody = z.object({
  id: objectIdString,
  imageData: z.string().min(1).max(10_000_000),
});

const idParams = z.object({ id: objectIdString });

module.exports = { submitBody, selfieBody, idParams };
