const mongoose = require("mongoose");
const env = require("./env");

// MongoDB connection settings — already validated by config/env.js
const MONGO_URI = env.MONGO_URI;
const MONGO_DB_NAME = env.MONGO_DB_NAME;

let mongoStatus = {
  isConnected: false,
  message: "Not connected",
};

// Connection options
const options = {
  autoIndex: true, // Build indexes
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

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
    };

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
    };
    console.error(`Error connecting to MongoDB: ${error.message}`);

    // In production, exit; in dev, keep server running
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

// Function to get current mongo status
const getMongoStatus = () => {
  return mongoStatus.message || "Unknown";
};

module.exports = { connectDB, mongoStatus: getMongoStatus };
