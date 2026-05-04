/**
 * Wraps an async route handler so any thrown / rejected error reaches the
 * central error middleware via `next(err)`. Eliminates try/catch boilerplate
 * in every controller.
 *
 * Usage:
 *   router.post("/foo", asyncHandler(async (req, res) => { ... }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
