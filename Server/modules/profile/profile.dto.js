const { z } = require("zod");

const email = z.email().trim().max(254);

// GET supports both /api/profile?email=... and /api/profile/:email
const getQuery = z.object({ email: email.optional() });
const getParams = z.object({ email: email.optional() });

// Profile is a permissive nested document; the legacy controller passed
// req.body straight to $set. Keep shape open via passthrough but require
// email since the upsert keys on it.
const upsertBody = z
  .object({
    email,
  })
  .passthrough();

const uploadBody = z.object({
  email: email.optional(), // also acceptable in query
});

module.exports = { getQuery, getParams, upsertBody, uploadBody };
