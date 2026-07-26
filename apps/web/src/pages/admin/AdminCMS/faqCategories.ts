/**
 * The FAQ categories the admin offers, plus a case-tolerant matcher.
 *
 * Stored categories are not normalized: the existing rows are lowercase
 * ("unique stay") while these labels are Title Case, so anything that compares
 * a stored value against a label has to fold case first. The public Help page
 * does the same — see `pages/Help.tsx`.
 *
 * Both the FAQs tab and AddFAQModal read the list from here; they each used to
 * hardcode their own copy, which is how the two drifted apart.
 */
export const FAQ_CATEGORIES = [
  "Camper Van",
  "Unique Stay",
  "Activity",
  "Guest",
  "Booking",
  "Common Questions",
  "Locations",
];

const fold = (value?: string) => (value || "").trim().toLowerCase();

/** True when a stored category and a displayed label mean the same category. */
export const sameFaqCategory = (a?: string, b?: string) => fold(a) === fold(b);

/**
 * The label matching a stored category, or "" when it isn't one we offer.
 * A `<select>` bound to a value with no matching `<option>` renders blank, so
 * the edit form has to map "unique stay" onto "Unique Stay" before binding.
 */
export const canonicalFaqCategory = (value?: string) =>
  FAQ_CATEGORIES.find((label) => sameFaqCategory(label, value)) || "";
