const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const targetType = z.enum(["Vendor", "User", "Staff"]);
const channel = z.enum(["Email", "SMS", "Whatsapp", "Push"]);
const serviceType = z.enum(["Caravan", "Stay", "Activity"]);

const sendBody = z.object({
  targetType,
  channels: z.array(channel).min(1),
  serviceType: z.union([serviceType, z.literal("")]).optional(),
  message: z.string().trim().min(1).max(20_000),
});

const listQuery = z.object({
  targetType: targetType.optional(),
  channels: channel.optional(),
});

const idParams = z.object({ id: objectIdString });

module.exports = { sendBody, listQuery, idParams };
