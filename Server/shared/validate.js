/**
 * Express middleware that validates request inputs against Zod schemas.
 *
 * Usage:
 *   const { z } = require("zod");
 *   const validate = require("../shared/validate");
 *
 *   const createBookingDto = z.object({
 *     serviceId: z.string().min(1),
 *     date: z.string().datetime(),
 *   });
 *
 *   router.post(
 *     "/bookings",
 *     validate({ body: createBookingDto }),
 *     asyncHandler(bookingsController.create),
 *   );
 *
 *   // Inside the controller, the parsed values are available as
 *   // req.validated.body / req.validated.params / req.validated.query.
 *
 * Why validated values are stored on `req.validated` rather than overwriting
 * `req.body`: keeps the original payload accessible for logging and avoids
 * surprising downstream code that still reads `req.body`.
 */
const { ValidationError } = require("./errors");

function formatIssues(zodError) {
  return zodError.issues.map((i) => ({
    path: i.path.join("."),
    code: i.code,
    message: i.message,
  }));
}

function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    try {
      if (schemas.body) validated.body = schemas.body.parse(req.body);
      if (schemas.params) validated.params = schemas.params.parse(req.params);
      if (schemas.query) validated.query = schemas.query.parse(req.query);
      req.validated = validated;
      next();
    } catch (err) {
      if (err && err.issues) {
        return next(new ValidationError("Invalid request", formatIssues(err)));
      }
      next(err);
    }
  };
}

module.exports = validate;
