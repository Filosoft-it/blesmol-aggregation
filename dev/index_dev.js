const logger = require("lorikeet-logger");
const express = require("express");
const database = require("./database/db");
const User = require("./database/models/user.model");
const Item = require("./database/models/item.model");
const apiFeatures = require("../apiFeatures");

const app = express();
let server = null;

// Middleware for parsing JSON requests
app.use(express.json());

// Routes definition (could be moved to a separate file for better organization)
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/users", async (req, res) => {
  try {
    const query = User.find();
    const features = new apiFeatures(query, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .populate();

    const results = await features.exec();
    const { documents, totalCount } = results;

    res.status(200).send({
      status: "success",
      results: documents,
      data: totalCount
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      error: error.toString() || "Internal Server Error"
    });
  }
});

app.get("/items", async (req, res) => {
  try {
    const query = Item.find();
    const features = new apiFeatures(query, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .populate();

    const results = await features.exec();
    const { documents, totalCount } = results;

    res.status(200).send({
      status: "success",
      results: documents,
      data: totalCount
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      error: error.toString() || "Internal Server Error"
    });
  }
});

// Error-handling middleware
app.use((err, req, res, next) => {
  logger.err(`Error: ${err.message}`);
  res.status(err.status || 500).send({
    status: "error",
    message: err.message || "Internal Server Error"
  });
});

const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== "test") {
      await database.connectDB();
      logger.info("Database connected successfully");
    }

    server =  app.listen(4300, () => {
      logger.info("Server is running on port 4300");
      logger.info("URL: http://127.0.0.1:4300");
    });

    logger.info(`Server loaded in ${process.env.NODE_ENV} mode`);
  } catch (error) {
    logger.err("Error starting the server:", error);
    process.exit(1); 
  }
};

const stopServer = async () => {
  // Close the server HTTP connection

  if (server) {
    server.close();
  }
}

startServer();

module.exports = { app, stopServer };
