const mongoose = require("mongoose");
const env = require("./env");

// MongoDB connection settings — already validated by config/env.js
const MONGO_URI = env.MONGO_URI;
const MONGO_DB_NAME = env.MONGO_DB_NAME;

let mongoStatus = {
  isConnected: false,
  message: "Not connected",
  /**
   * Has a connection attempt failed? Distinguishes "still shaking hands on a
   * cold start" (where Mongoose should buffer) from "we already know this host
   * is unreachable" (where requests should be refused immediately). See
   * middleware/dbReady.js.
   */
  hasFailed: false,
};

// Connection options
const options = {
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  /**
   * Address family is deliberately NOT pinned.
   *
   * This used to be `family: 4` ("use IPv4, skip trying IPv6"), which forces
   * `dns.lookup(host, { family: 4 })`. On an IPv6-only network with NAT64/DNS64
   * — increasingly common on mobile tethering and some ISPs — the resolver
   * serves *only* a synthesized AAAA record (a 64:ff9b::/96 address) for
   * IPv4-only hosts like Atlas. Asking it for an A record returns
   * `getaddrinfo ENOENT`, so every shard host fails selection and the driver
   * reports its generic "check your IP allow-list" hint, which sends you looking
   * in entirely the wrong place. Leaving the family unset lets Node take the
   * NAT64 address and route normally.
   *
   * Set MONGO_IP_FAMILY=4 (or 6) only if a specific host genuinely needs it.
   */
  ...(process.env.MONGO_IP_FAMILY ? { family: Number(process.env.MONGO_IP_FAMILY) } : {}),
};

// How long a query may sit buffered on a downed connection before it throws.
// The 10s default meant a page whose calls all queued behind a dead connection
// froze for ten seconds and then 500ed. `middleware/dbReady.js` rejects those
// requests up front; this only bounds the race where the link drops mid-query.
mongoose.set("bufferTimeoutMS", 5000);

/** Delay between initial-connection retries (dev only — see connectDB). */
const RETRY_DELAY_MS = 5000;
let retryTimer = null;

/**
 * Connect to MongoDB database
 * Switch DBs by changing MONGO_URI and/or MONGO_DB_NAME only.
 */
const connectDB = async () => {
  try {
    // For development, we'll disable strict query to make development easier
    mongoose.set("strictQuery", false);

    console.log(
      `Attempting to connect to MongoDB at: ${MONGO_URI}${MONGO_DB_NAME ? ` (DB: ${MONGO_DB_NAME})` : ""}`,
    );

    // Connect to the database; allow optional dbName override
    const conn = await mongoose.connect(MONGO_URI, {
      ...options,
      ...(MONGO_DB_NAME && { dbName: MONGO_DB_NAME }),
    });

    mongoStatus = {
      isConnected: true,
      message: `Connected to ${conn.connection.host}${MONGO_DB_NAME ? `/${MONGO_DB_NAME}` : ""}`,
      hasFailed: false,
    };

    // A retry loop from an earlier failed attempt has done its job.
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    console.log(`MongoDB connected successfully`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
      mongoStatus.isConnected = false;
      mongoStatus.message = `Connection error: ${err.message}`;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
      mongoStatus.isConnected = false;
      mongoStatus.message = "Disconnected, attempting reconnect";
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
      mongoStatus.isConnected = true;
      mongoStatus.message = "Reconnected successfully";
    });
  } catch (error) {
    mongoStatus = {
      isConnected: false,
      message: `Connection failed: ${error.message}`,
      hasFailed: true,
    };
    console.error(`Error connecting to MongoDB: ${error.message}`);

    // Without this, a dev whose Mongo is unreachable just sees every request
    // 500 with a MongoServerSelectionError stack and no hint about the cause.
    if (/localhost|127\.0\.0\.1/.test(String(MONGO_URI))) {
      console.error(
        "[db] MONGO_URI points at a LOCAL MongoDB that isn't accepting connections.\n" +
          "     Either start it (Windows: `net start MongoDB` from an elevated prompt)\n" +
          "     or point MONGO_URI at the Atlas cluster in Server/.env.development.",
      );
    } else {
      console.error(
        "[db] Check MONGO_URI credentials and that this machine's IP is on the\n" +
          "     Atlas Network Access allow-list.",
      );
    }

    // In production, exit; in dev, keep server running
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }

    /**
     * Keep trying in the background.
     *
     * Mongoose's automatic reconnection only arms itself after a successful
     * initial handshake — if the very first `connect()` fails, readyState stays
     * at 0 forever and every request 503s until someone restarts the process,
     * even once MongoDB is back up. Retrying here means starting Mongo after the
     * API is enough to bring the app back on its own.
     */
    if (!retryTimer && env.NODE_ENV !== "test") {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        console.log("[db] retrying MongoDB connection…");
        void connectDB();
      }, RETRY_DELAY_MS);
      retryTimer.unref?.(); // never hold the process open just for a retry
    }
  }
};

// Function to get current mongo status
const getMongoStatus = () => {
  return mongoStatus.message || "Unknown";
};

/** Structured view of the connection, for the readiness gate + /api/health. */
const getMongoState = () => ({ ...mongoStatus });

module.exports = { connectDB, mongoStatus: getMongoStatus, mongoState: getMongoState };
