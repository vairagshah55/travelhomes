const { z } = require("zod");

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid id format");

// ─── Jobs ───────────────────────────────────────────────────────────────
const jobsListQuery = z.object({
  active: z.enum(["true", "false"]).optional(),
});

// The SPA sends two naming conventions interchangeably (jobTitle vs
// position, etc). We accept both at the edge and the service collapses
// them. Required-ness is enforced post-collapse via .refine.
const jobBody = z
  .object({
    position: z.string().trim().max(200).optional(),
    jobTitle: z.string().trim().max(200).optional(),
    experience: z.string().trim().max(200).optional(),
    experienceRequired: z.string().trim().max(200).optional(),
    location: z.string().trim().max(200).optional(),
    jobType: z.string().trim().max(200).optional(),
    jd: z.string().trim().max(20_000).optional(),
    jobDescription: z.string().trim().max(20_000).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.position || d.jobTitle, {
    message: "Missing job title",
    path: ["position"],
  })
  .refine((d) => d.jd || d.jobDescription, {
    message: "Missing job description",
    path: ["jd"],
  });

// PUT /jobs/:id — same shape but neither field is required.
const jobUpdateBody = z
  .object({
    position: z.string().trim().max(200).optional(),
    jobTitle: z.string().trim().max(200).optional(),
    experience: z.string().trim().max(200).optional(),
    experienceRequired: z.string().trim().max(200).optional(),
    location: z.string().trim().max(200).optional(),
    jobType: z.string().trim().max(200).optional(),
    jd: z.string().trim().max(20_000).optional(),
    jobDescription: z.string().trim().max(20_000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

// ─── Job Applications ──────────────────────────────────────────────────
const jobApplyBody = z
  .object({
    jobId: z.string().trim().max(120).optional(),
    jobTitle: z.string().trim().max(200).optional(),
    fullName: z.string().trim().min(1).max(200),
    mobile: z.string().trim().max(40).optional(),
    email: z.email().trim().max(254),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    experience: z.string().trim().max(120).optional(),
    linkedin: z.string().trim().max(500).optional(),
    referral: z.string().trim().max(200).optional(),
  })
  .strict();

const jobApplicationStatusBody = z.object({
  status: z.string().trim().min(1).max(60),
});

// ─── FAQs ──────────────────────────────────────────────────────────────
const faqBody = z
  .object({
    category: z.string().trim().min(1).max(120),
    question: z.string().trim().min(1).max(2000),
    answer: z.string().trim().min(1).max(20_000),
  })
  .strict();

// ─── Testimonials ──────────────────────────────────────────────────────
const testimonialBody = z
  .object({
    userName: z.string().trim().min(1).max(200),
    rating: z.coerce.number().min(0).max(5),
    content: z.string().trim().min(1).max(20_000),
    avatar: z.string().trim().max(2000).optional(),
    email: z.email().trim().max(254).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

// ─── Features ──────────────────────────────────────────────────────────
const featuresListQuery = z.object({
  category: z.string().trim().max(120).optional(),
  type: z.string().trim().max(60).optional(),
});

const featureBody = z
  .object({
    name: z.string().trim().min(1).max(200),
    category: z.string().trim().min(1).max(120),
    icon: z.string().trim().max(500).optional(),
    type: z.string().trim().max(60).optional(),
    description: z.string().trim().max(2000).optional(),
  })
  .strict();

// ─── Roles ─────────────────────────────────────────────────────────────
const roleBody = z
  .object({
    name: z.string().trim().min(1).max(120),
    features: z.array(z.string().max(120)).optional(),
  })
  .strict();

// ─── CMS Pages ─────────────────────────────────────────────────────────
const cmsPageKey = z.enum(["terms-and-conditions", "privacy-policy", "vendor-policy"]);
const pageKeyParams = z.object({ key: cmsPageKey });

// Page content varies wildly across page types. Accept arbitrary
// `content` and `sections` shapes with a small required surface.
const pageUpdateBody = z
  .object({
    title: z.string().trim().max(500).optional(),
    content: z.unknown().optional(),
    sections: z.unknown().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough();

// ─── Contact ───────────────────────────────────────────────────────────
const contactBody = z.object({}).passthrough();

// ─── Homepage Sections ─────────────────────────────────────────────────
const homepageSectionKeyParams = z.object({
  key: z.string().trim().min(1).max(120),
});

const idParams = z.object({ id: objectIdString });
const roleIdParams = z.object({ id: z.string().trim().min(1).max(120) });

module.exports = {
  jobsListQuery,
  jobBody,
  jobUpdateBody,
  jobApplyBody,
  jobApplicationStatusBody,
  faqBody,
  testimonialBody,
  featuresListQuery,
  featureBody,
  roleBody,
  pageKeyParams,
  pageUpdateBody,
  contactBody,
  homepageSectionKeyParams,
  idParams,
  roleIdParams,
};
