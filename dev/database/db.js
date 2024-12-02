const mongoose = require("mongoose");
const logger = require("lorikeet-logger");

const DB_URL = process.env.DB_URL || "mongodb://localhost:27017/test";

const UsersModel = require("./models/user.model");
const ItemsModel = require("./models/item.model");

const testUsers = require("./data/users.data");
const testItems = require("./data/items.data");

async function connectDB() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(DB_URL);
    logger.info(`🌳 DB connected to: ${mongoose.connection.name}`);
    await restoreDB();
  } catch (err) {
    logger.err("💔 Error connecting to the database");
    logger.err(err);
    throw err; // Re-throw the error to ensure the caller is aware of the failure
  }

  return mongoose.connection;
}

async function closeDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    logger.info("Database connection closed");
  }
}

async function restoreDB() {
  if (!mongoose.connection.db) {
    logger.err("Database connection is not available");
    return;
  }

  logger.info("Restoring the database...");

  try {
    logger.info("|- Dropping the database");
    await mongoose.connection.db.dropDatabase();

    logger.info("|- Updating users");
    await UsersModel.insertMany(testUsers.testUsers);

    logger.info("|- Updating items");
    await ItemsModel.insertMany(testItems.testItems);

    logger.info("Database successfully restored!\n");
  } catch (err) {
    logger.err("💔 Error during database restoration");
    logger.err(err);
    throw err; // Propagate the error to indicate the failure
  }
}

module.exports = { connectDB, closeDB };
