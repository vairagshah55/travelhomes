import { describe, expect, it } from "vitest";

import { parseCsv } from "./csvIo";
import { blogsToCsv, buildBlogImportPlan, BLOG_CSV_COLUMNS, type BlogRecord } from "./blogsIo";

const post = (over: Partial<BlogRecord> = {}): BlogRecord => ({
  _id: "b1",
  title: "Himalayan road trip",
  slug: "himalayan-road-trip",
  category: "Road trips",
  status: "published",
  description: "A guide.",
  content: "<p>Body</p>",
  authorName: "Asha Menon",
  authorRole: "Travel writer",
  ...over,
});

const csvOf = (rows: string[][]) =>
  [BLOG_CSV_COLUMNS.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

/** Header + one row, with only the named columns present. */
const partialCsv = (cols: string[], values: string[]) => `${cols.join(",")}\r\n${values.join(",")}`;

describe("blogsToCsv", () => {
  it("writes every column in the documented order", () => {
    const grid = parseCsv(blogsToCsv([post()]));
    expect(grid[0]).toEqual([...BLOG_CSV_COLUMNS]);
  });

  it("round-trips HTML content containing commas, quotes and newlines", () => {
    const content = '<p>Hello, "world"</p>\n<p>Second line</p>';
    const grid = parseCsv(blogsToCsv([post({ content })]));
    const contentIdx = BLOG_CSV_COLUMNS.indexOf("content");
    expect(grid[1][contentIdx]).toBe(content);
  });

  it("normalises status to published unless the row is a draft", () => {
    const statusIdx = BLOG_CSV_COLUMNS.indexOf("status");
    expect(parseCsv(blogsToCsv([post({ status: "draft" })]))[1][statusIdx]).toBe("draft");
    expect(parseCsv(blogsToCsv([post({ status: undefined })]))[1][statusIdx]).toBe("published");
  });
});

describe("buildBlogImportPlan — matching", () => {
  const existing = [post()];

  it("updates in place on a full export round-trip", () => {
    const plan = buildBlogImportPlan(blogsToCsv(existing), existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates[0].existing?._id).toBe("b1");
  });

  it("matches on slug when the file carries no id", () => {
    const csv = partialCsv(["title", "slug"], ["Renamed headline", "himalayan-road-trip"]);
    const plan = buildBlogImportPlan(csv, existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].payload.title).toBe("Renamed headline");
  });

  it("matches on title, case-insensitively, as a last resort", () => {
    const plan = buildBlogImportPlan(partialCsv(["title"], ["himalayan ROAD trip"]), existing);
    expect(plan.updates).toHaveLength(1);
  });

  it("creates when nothing matches", () => {
    const plan = buildBlogImportPlan(partialCsv(["title"], ["Something new"]), existing);
    expect(plan.creates).toHaveLength(1);
  });

  it("warns when an id is present but unknown, and still matches on slug", () => {
    const csv = partialCsv(["id", "title", "slug"], ["nope", "X", "himalayan-road-trip"]);
    const plan = buildBlogImportPlan(csv, existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].warnings.join(" ")).toMatch(/matched on slug\/title instead/i);
  });

  it("does not claim a slug/title match on a row it is creating", () => {
    const csv = partialCsv(["id", "title"], ["nope", "Nothing like this exists"]);
    const plan = buildBlogImportPlan(csv, existing);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0].warnings.join(" ")).toMatch(/importing it as a new post/i);
    expect(plan.creates[0].warnings.join(" ")).not.toMatch(/matched on slug/i);
  });
});

describe("buildBlogImportPlan — legacy inline images", () => {
  /* Roughly what a post written before the CMS uploaded to /uploads holds. */
  const dataUri = `data:image/jpeg;base64,${"A".repeat(20_000)}`;

  it("re-imports an export of a post whose images are inline base64", () => {
    const stored = post({ coverImage: dataUri, authorImg: dataUri });
    const plan = buildBlogImportPlan(blogsToCsv([stored]), [stored]);
    expect(plan.errors).toHaveLength(0);
    expect(plan.updates).toHaveLength(1);
  });

  it("drops the cell rather than sending an image the server would reject", () => {
    const stored = post({ coverImage: dataUri, authorImg: dataUri });
    const { payload, warnings } = buildBlogImportPlan(blogsToCsv([stored]), [stored]).updates[0];
    expect(payload.coverImage).toBeUndefined();
    expect(payload.authorImg).toBeUndefined();
    expect(warnings.join(" ")).toMatch(/cover image is an inline base64 image/i);
    expect(warnings.join(" ")).toMatch(/author image is an inline base64 image/i);
  });

  it("keeps the rest of the row — the text columns still import", () => {
    const stored = post({ coverImage: dataUri });
    const csv = partialCsv(
      ["title", "slug", "coverImage"],
      ["Rewritten headline", "himalayan-road-trip", dataUri],
    );
    expect(buildBlogImportPlan(csv, [stored]).updates[0].payload.title).toBe("Rewritten headline");
  });

  it("still errors on an over-long value that is not an inline image", () => {
    const csv = partialCsv(
      ["title", "coverImage"],
      ["X", `https://cdn.test/${"a".repeat(2000)}.jpg`],
    );
    expect(buildBlogImportPlan(csv, []).errors[0].errors.join(" ")).toMatch(
      /over 2000 characters/i,
    );
  });
});

describe("buildBlogImportPlan — the slug must not drift", () => {
  const existing = [post()];

  it("re-sends the existing slug when a title-only edit arrives", () => {
    /* The realistic flow: export (which carries the id), fix the headline,
       clear or ignore the slug cell, re-import. Without pinning the slug,
       `blogs.service.update` re-derives it from the new title and the post's
       public URL changes silently. */
    const plan = buildBlogImportPlan(
      partialCsv(["id", "title", "slug"], ["b1", "New headline", ""]),
      existing,
    );
    expect(plan.updates).toHaveLength(1);
    expect(plan.updates[0].payload.title).toBe("New headline");
    expect(plan.updates[0].payload.slug).toBe("himalayan-road-trip");
  });

  it("honours an explicit slug when the file gives one", () => {
    const plan = buildBlogImportPlan(
      partialCsv(["id", "title", "slug"], ["b1", "New headline", "deliberate-new-slug"]),
      existing,
    );
    expect(plan.updates[0].payload.slug).toBe("deliberate-new-slug");
  });

  it("leaves the slug unset on a create, so the server derives it", () => {
    const plan = buildBlogImportPlan(partialCsv(["title"], ["Brand new post"]), existing);
    expect(plan.creates[0].payload.slug).toBeUndefined();
  });

  it("rejects a slug the server's DTO would refuse", () => {
    for (const bad of ["Has Capitals", "has spaces", "trailing-", "double--hyphen", "sym!bol"]) {
      const plan = buildBlogImportPlan(partialCsv(["title", "slug"], ["T", bad]), []);
      expect(plan.errors, bad).toHaveLength(1);
      expect(plan.errors[0].errors.join(" ")).toMatch(/slug/i);
    }
  });
});

describe("buildBlogImportPlan — status defaults", () => {
  it("imports a new post with no status column as a draft", () => {
    const plan = buildBlogImportPlan(partialCsv(["title"], ["Unfinished"]), []);
    expect(plan.creates[0].payload.status).toBe("draft");
    expect(plan.creates[0].warnings.join(" ")).toMatch(/draft/i);
  });

  it("keeps an existing post's status when the column is blank", () => {
    const drafted = [post({ status: "draft" })];
    const plan = buildBlogImportPlan(
      partialCsv(["title", "status"], ["Himalayan road trip", ""]),
      drafted,
    );
    expect(plan.updates[0].payload.status).toBe("draft");
  });

  it("honours an explicit status", () => {
    const plan = buildBlogImportPlan(partialCsv(["title", "status"], ["X", "published"]), []);
    expect(plan.creates[0].payload.status).toBe("published");
    expect(plan.creates[0].warnings).toHaveLength(0);
  });

  it("rejects a status the admin UI cannot produce", () => {
    // `archived` is in the Mongoose enum but unreachable from the tab, so a row
    // using it would save and then be uneditable.
    for (const bad of ["archived", "live", "yes"]) {
      const plan = buildBlogImportPlan(partialCsv(["title", "status"], ["X", bad]), []);
      expect(plan.errors, bad).toHaveLength(1);
    }
  });
});

describe("buildBlogImportPlan — payloads only carry what the row had", () => {
  it("omits absent columns rather than blanking saved values", () => {
    const plan = buildBlogImportPlan(partialCsv(["title"], ["Himalayan road trip"]), [post()]);
    const payload = plan.updates[0].payload;
    expect(payload.title).toBe("Himalayan road trip");
    expect(payload).not.toHaveProperty("category");
    expect(payload).not.toHaveProperty("content");
    expect(payload).not.toHaveProperty("metaTitle");
  });

  it("carries the SEO columns through when they are present", () => {
    const csv = partialCsv(
      ["title", "metaTitle", "metaKeywords", "metaDescription"],
      ["X", "Meta title", "a, b", "Meta description"],
    );
    // The keywords cell contains a comma, so it must be quoted to survive.
    const quoted = csv.replace("a, b", '"a, b"');
    const plan = buildBlogImportPlan(quoted, []);
    expect(plan.creates[0].payload.metaKeywords).toBe("a, b");
    expect(plan.creates[0].payload.metaDescription).toBe("Meta description");
  });
});

describe("buildBlogImportPlan — rejections", () => {
  it("is fatal on an empty file", () => {
    expect(buildBlogImportPlan("", []).fatal).toMatch(/empty/i);
  });

  it("is fatal when there is no title column", () => {
    expect(buildBlogImportPlan("slug,content\r\na,b", []).fatal).toMatch(/title/i);
  });

  it("errors on a row with no title", () => {
    const plan = buildBlogImportPlan(partialCsv(["title", "category"], ["", "Road trips"]), []);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].errors.join(" ")).toMatch(/title is required/i);
  });

  it("catches an over-long field before the request is made", () => {
    const plan = buildBlogImportPlan(partialCsv(["title"], ["x".repeat(201)]), []);
    expect(plan.errors[0].errors.join(" ")).toMatch(/over 200 characters/i);
  });

  it("rejects two rows claiming the same slug", () => {
    const csv = `title,slug\r\nOne,same-slug\r\nTwo,same-slug`;
    const plan = buildBlogImportPlan(csv, []);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].errors.join(" ")).toMatch(/duplicate slug/i);
  });

  it("rejects two rows claiming the same title when neither has a slug", () => {
    const plan = buildBlogImportPlan(`title\r\nSame\r\nSame`, []);
    expect(plan.errors).toHaveLength(1);
    expect(plan.errors[0].errors.join(" ")).toMatch(/duplicate title/i);
  });

  it("reports the source line so an error is findable in the file", () => {
    const plan = buildBlogImportPlan(`title\r\nFine\r\n${"x".repeat(201)}`, []);
    expect(plan.errors[0].line).toBe(3);
  });
});

describe("buildBlogImportPlan — never destructive", () => {
  it("plans no deletion for posts missing from the file", () => {
    const existing = [post(), post({ _id: "b2", title: "Second", slug: "second" })];
    const plan = buildBlogImportPlan(partialCsv(["title", "slug"], ["Second", "second"]), existing);
    expect(plan.updates).toHaveLength(1);
    expect(plan.creates).toHaveLength(0);
    // Nothing in the plan can express a delete — that's the guarantee.
    expect(Object.keys(plan)).not.toContain("deletes");
  });
});
