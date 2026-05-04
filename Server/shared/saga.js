/**
 * Saga helper for multi-document atomic operations.
 *
 * The Razorpay verify flow creates four documents (Booking + BookingDetail
 * + CalendarBooking + Payment). If any creation fails partway, the database
 * ends up inconsistent — money charged on Razorpay's side, partial records
 * locally. The legacy controller had no protection.
 *
 * `runSaga` provides two modes:
 *
 *   1. **Transactional** (preferred): wraps the steps in a MongoDB
 *      transaction. Requires a replica set / sharded cluster (Atlas, or
 *      a single-node replica set locally via `mongod --replSet`). If any
 *      step throws, MongoDB aborts the transaction and rolls everything
 *      back.
 *
 *   2. **Compensation** (fallback): if the deployment doesn't support
 *      transactions (standalone `mongod`), runs the steps serially. On
 *      failure, runs each completed step's `undo` in reverse order to
 *      compensate. We log loudly when this path is taken because the
 *      guarantees are weaker (compensation can itself fail; transactions
 *      are strictly stronger).
 *
 * Each step is `{ do: async (session?) => doc, undo: async (doc) => void }`.
 * In transactional mode `do` is invoked with a session that the caller MUST
 * pass through to Mongoose .save({ session }) calls. In compensation mode
 * `do` is invoked with `null`.
 */
const mongoose = require("mongoose");
const logger = require("./logger");
const { AppError } = require("./errors");

// Mongo error codes / messages that indicate transactions aren't available.
function isTransactionUnsupported(err) {
  if (!err) return false;
  const msg = String(err.message || "");
  // CodeName "IllegalOperation" (code 20) is what standalone mongod throws
  // for `startTransaction`. Atlas free-tier deployments are replica sets
  // and support transactions.
  if (err.code === 20) return true;
  if (/Transaction numbers are only allowed on a replica set/i.test(msg)) return true;
  if (/does not support transactions/i.test(msg)) return true;
  if (/replica set/i.test(msg) && /transaction/i.test(msg)) return true;
  return false;
}

/**
 * @param {Array<{do: Function, undo: Function}>} steps — operations + their compensations
 * @param {object} [opts]
 * @param {string} [opts.name='saga'] — name used in log lines
 * @returns {Promise<Array>} the array of documents returned by each `do`
 */
async function runSaga(steps, { name = "saga" } = {}) {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error("runSaga: at least one step is required");
  }

  // ─── Mode 1: try a transaction. ────────────────────────────────────────────
  const session = await mongoose.startSession();
  try {
    let results;
    await session.withTransaction(async () => {
      results = [];
      for (const step of steps) {
        results.push(await step.do(session));
      }
    });
    logger.debug({ name, steps: steps.length }, "saga: committed transactionally");
    return results;
  } catch (err) {
    if (!isTransactionUnsupported(err)) {
      // A non-transactional error (e.g. validation, duplicate key). The
      // transaction itself rolled back; just propagate.
      throw err;
    }
    // Else: deployment doesn't support transactions. Drop into compensation.
    logger.warn(
      { name, mongoError: err.message },
      "saga: transactions unsupported on this MongoDB deployment — falling back to compensation. " +
        "For atomic guarantees, deploy against a replica set (Atlas, or `mongod --replSet`).",
    );
  } finally {
    session.endSession();
  }

  // ─── Mode 2: compensation. ─────────────────────────────────────────────────
  const completed = [];
  try {
    const results = [];
    for (const step of steps) {
      const doc = await step.do(null);
      completed.push({ step, doc });
      results.push(doc);
    }
    return results;
  } catch (err) {
    logger.error(
      { name, completedCount: completed.length, err: err.message },
      "saga: step failed — running compensations in reverse",
    );
    for (let i = completed.length - 1; i >= 0; i--) {
      const { step, doc } = completed[i];
      try {
        await step.undo(doc);
      } catch (uerr) {
        // A failed compensation is a serious operational issue — the
        // database is now inconsistent and needs manual cleanup. Log
        // enough context that an operator can fix it.
        logger.error(
          { name, step: i, err: uerr.message, doc: doc?._id },
          "saga: COMPENSATION FAILED — manual cleanup required",
        );
      }
    }
    throw new AppError("SAGA_FAILED", 500, `Operation failed and was rolled back: ${err.message}`);
  }
}

module.exports = { runSaga, isTransactionUnsupported };
