const request = require("supertest");
const serverApp = require("../index_dev"); // Import the app instance for testing

// Database and models
const database = require("../database/db");
const User = require("../database/models/user.model");
const Item = require("../database/models/item.model");

// Utils
const Test = require("../utils/test.util");

const app = serverApp.app;

// Main test suite
describe("API Tests", () => {
  let testInstance;
  let expectedData = {};

  // Connect to the database and set up initial data
  beforeAll(async () => {
    await database.connectDB();
    testInstance = new Test(app);

    // Fetch initial data from the database for comparison
    expectedData.user1 = await User.find({});
    expectedData.item1 = await Item.find({});
  });

  afterAll(async () => {
    // Close the database connection after all tests are done
    await serverApp.stopServer();
  });

  describe("Server up", () => {
    it("Should return 200 when accessing the root endpoint", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
    });
  });

  describe("API Endpoints", () => {
    it("Should handle /users endpoint", async () => {
      await testInstance.generateTest("/users", [], expectedData.user1);
    });

    it("Should handle /items endpoint", async () => {
      await testInstance.generateTest("/items", [], expectedData.item1);
    });
  });
});
