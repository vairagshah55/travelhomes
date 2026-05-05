const { z } = require("zod");

// `id` accepts a Mongo ObjectId or a custom vendorId string.
const vendorIdLike = z.string().trim().min(1).max(60);

// SPA-side status filter aliases.
const statusFilter = z.union([
  z.literal("all-vendors"),
  z.literal("pending-vendors"),
  z.string().trim().max(40),
]);

// Updated to match Model enums + frontend.
const vendorStatus = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended",
  "active",
  "inactive",
  "banned",
  "kyc-unverified",
]);

const listQuery = z.object({
  status: statusFilter.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const idParams = z.object({ id: vendorIdLike });

// Vendor model is wide and gets enriched at read time. Keep create/update
// permissive (passthrough) but require email on create — the legacy
// controller relied on it for unique lookup.
const createBody = z
  .object({
    email: z.email().trim().max(254),
  })
  .passthrough();

const updateBody = z.object({}).passthrough();

const updateStatusBody = z.object({ status: vendorStatus });

module.exports = { listQuery, idParams, createBody, updateBody, updateStatusBody };
