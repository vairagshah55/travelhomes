/**
 * Fail fast when MongoDB is unreachable.
 *
 * Without this, a request that arrives while the connection is down doesn't
 * fail — Mongoose *buffers* it, holds it for `bufferTimeoutMS`, and only then
 * throws `Operation \`x.findOne()\` buffering timed out after 10000ms`, which the
 * error handler reports as a generic 500. Every call the page makes pays that
 * timeout in parallel, so the SPA looks frozen for ten seconds and then says
 * "Internal server error" — with no hint that the database is the problem.
 *
 * readyState: 0 disconnected · 1 connected · 2 connecting · 3 disconnecting
 *
 * State 2 is ambiguous: it covers both a cold start (where buffering is exactly
 * right — the first request after a restart should wait for the handshake) and a
 * doomed retry against a host we already know we can't reach. `hasFailed` from
 * config/db.js separates them, so the gate only pays the server-selection
 * timeout once rather than on every request.
 */
const mongoose = require("mongoose");
const { mongoState } = require("../config/db");
const { AppError } = require("../shared/errors");

function requireDatabase(_req, _res, next) {
  const state = mongoose.connection.readyState;
  if (state === 1) return next();

  // Cold start, nothing has failed yet — let Mongoose buffer through the
  // handshake instead of 503ing the first request after boot.
  if (state === 2 && !mongoState().hasFailed) return next();

  return next(
    new AppError("DATABASE_UNAVAILABLE", 503, "Database is unavailable. Please try again.", {
      // The precise reason (bad credentials, IP not allow-listed, host down)
      // is already in the server log — point there rather than guessing.
      hint: `The API can't reach MongoDB: ${mongoState().message}`,
    }),
  );
}

module.exports = { requireDatabase };
