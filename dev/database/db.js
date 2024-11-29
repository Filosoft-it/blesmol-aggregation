const mongoose = require("mongoose");
const logger = require("lorikeet-logger");

const DB_URL = process.env.DB_URL || "mongodb://localhost:27017/test";

function connectDB() {
  mongoose.set("strictQuery", true);

  mongoose.connect(DB_URL, {}).then(
    () => {
      logger.info("💚 Connected to the database");
      restoreDB();
    },
    (err) => {
      logger.err("💔 Error connecting to the database");
      logger.err(err);
    }
  );

  return mongoose.connection;
}

async function restoreDB() {
  if (!mongoose.connection.db) {
    logger.err("Database connection is not available");
    return;
  }

  logger.info("Restoring the database:");

  logger.info("|-Dropping the database");
  await mongoose.connection.db.dropDatabase();

  logger.info("|-Updating users");
  const UsersModel = require("./models/user.model");
  const { testUsers } = require("./data/users.data");
  await UsersModel.insertMany(testUsers);

  logger.info("|-Updating items");
  const ItemsModel = require("./models/item.model");
  const { testItems } = require("./data/items.data");
  await ItemsModel.insertMany(testItems);

  logger.info("Database restored");
}

module.exports = { connectDB };