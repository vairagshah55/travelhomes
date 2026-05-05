const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

const idParams = z.object({ id: objectIdString });

const createBody = z
  .object({
    images: z.array(z.string().trim().min(1).max(2000)).optional(),
    additionalCount: z.number().int().nonnegative().optional(),
    content: z.string().trim().max(20_000).optional(),
  })
  .refine(
    (d) => (Array.isArray(d.images) && d.images.length > 0) || (d.content && d.content.length > 0),
    {
      message: "Must provide either images or content",
    },
  );

const postBody = z.object({
  itemId: objectIdString,
  platform: z.enum(["facebook", "instagram"]),
});

module.exports = { idParams, createBody, postBody };
