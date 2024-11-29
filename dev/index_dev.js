const logger = require("lorikeet-logger");
const express = require("express");

const database = require("./database/db");

// Load the api features
const apiFeatures = require("../apiFeatures");

database.connectDB();

const app = express();

// Load the routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/users", (req, res) => {
  res.send({
    status: "success",
    results: [],
    data: [],
  })
});

app.get("/items", (req, res) => {
  res.send({
    status: "success",
    results: [],
    data: [],
  })
});


app.listen(4300, () => {
  logger.info("Server is running on port 4300");
  logger.info("URL: http://127.0.0.1:4300");
});

console.log("Server loaded in " + process.env.NODE_ENV + " mode");
