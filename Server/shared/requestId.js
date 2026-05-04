/**
 * Attach a stable request id to every request.
 * Honors an inbound `X-Request-Id` header if present (for trace propagation
 * across services); otherwise generates a fresh nanoid.
 */
const { nanoid } = require("nanoid");

function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const id = typeof incoming === "string" && incoming.length > 0 ? incoming : nanoid();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

module.exports = requestId;
