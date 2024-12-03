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
    expectedData.user2 = await User.where('name').equals('Jane Smith');
    expectedData.user3 = await User.find({
      name: { $regex: 'John', $options: 'i' }
    });
    expectedData.user4 = await User.find({}).sort('name');
    expectedData.user5 = await User.find({}).sort({ name: -1 });
    expectedData.user6 = await User.find({}, 'name email');
    expectedData.user7 = await User.find({}).populate('items');
    expectedData.user8 = await User.find({ name: 'Jane Smith' }).sort('name');
    expectedData.user9 = await User.find({ name: 'Jane Smith' }, 'name email');
    expectedData.user10 = await User.find({ name: { $regex: 'John', $options: 'i' } }, 'name email');
    expectedData.user11 = await User.find({
      $or: [{ name: { $regex: 'example1', $options: 'i' } }, { email: { $regex: 'example1', $options: 'i' } }]
    });

    expectedData.item1 = await Item.find({});
    expectedData.item2 = await Item.find({}).populate('users');
    expectedData.item3 = await Item.find({}).limit(1);
    expectedData.item4 = await Item.find({}).skip(1).limit(1);
    expectedData.item5 = await Item.find({}).sort('name').skip(1).limit(1);
    expectedData.item6 = await Item.find({}).sort('name').skip(1).limit(1).populate('users', 'name');
    expectedData.item7 = await Item.find({}).skip(2);
    expectedData.item8 = await Item.find({}).sort({ _id: -1 });
    expectedData.item9 = await Item.find({}).skip(1).limit(2);
    expectedData.item10 = await Item.find({ 'variant.color': 'Yellow' });
    expectedData.item11 = await Item.find({}).sort('-variant.color');
    expectedData.item12 = await Item.find({}).populate('variant.users', 'name');
    expectedData.item13 = await Item.find({ 'variant.size': 'Medium' }).populate('variant.users', 'name');
  });

  afterAll(async () => {
    // Close the database connection after all tests are done
    await serverApp.stopServer();
    await database.closeDB();
  });

  describe('Server up', () => {
    it('Should return 200 when accessing the root endpoint', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('API Endpoints', () => {
    // Users

    it('Should handle /users endpoint', async () => {
      await testInstance.generateTest('/users', [], expectedData.user1);
    });

    it('Should handle /users endpoint with params: name=Jane Smith', async () => {
      await testInstance.generateTest('/users', ['name=Jane Smith'], expectedData.user2);
    });

    it('Should handle /users endpoint with params: name[s]=John', async () => {
      await testInstance.generateTest('/users', ['name[s]=John'], expectedData.user3);
    });

    it('Should handle /users endpoint with params: sort=name', async () => {
      await testInstance.generateTest('/users', ['sort=name'], expectedData.user4);
    });

    it('Should handle /users endpoint with params: sort=-name', async () => {
      await testInstance.generateTest('/users', ['sort=-name'], expectedData.user5);
    });

    it('Should handle /users endpoint with params: fields=name;email', async () => {
      await testInstance.generateTest('/users', ['fields=name;email'], expectedData.user6);
    });

    it('Should handle /users endpoint with params: items[p]=*', async () => {
      await testInstance.generateTest('/users', ['items[p]=*'], expectedData.user7);
    });

    it('Should handle /users endpoint with params: name=Jane Smith&sort=name', async () => {
      await testInstance.generateTest('/users', ['name=Jane Smith', 'sort=name'], expectedData.user8);
    });

    it('Should handle /users endpoint with params: name=Jane Smith&fields=name;email', async () => {
      await testInstance.generateTest('/users', ['name=Jane Smith', 'fields=name;email'], expectedData.user9);
    });

    it('Should handle /users endpoint with params: name[s]=John&fields=name;email', async () => {
      await testInstance.generateTest('/users', ['name[s]=John', 'fields=name;email'], expectedData.user10);
    });

    it('Should handle /users endpoint with params: search=example1', async () => {
      await testInstance.generateTest('/users', ['search=example1'], expectedData.user11);
    });

    // Items

    it('Should handle /items endpoint', async () => {
      await testInstance.generateTest('/items', [], expectedData.item1);
    });

    it('Should handle /items endpoint with params: users[p]=*', async () => {
      await testInstance.generateTest('/items', ['users[p]=*'], expectedData.item2);
    });

    it('Should handle /items endpoint with params: limit=1', async () => {
      await testInstance.generateTest('/items', ['limit=1'], expectedData.item3);
    });

    it('Should handle /items endpoint with params: limit=1&page=2', async () => {
      await testInstance.generateTest('/items', ['limit=1', 'page=2'], expectedData.item4);
    });

    it('Should handle /items endpoint with params: limit=1&page=2&sort=name', async () => {
      await testInstance.generateTest('/items', ['limit=1', 'page=2', 'sort=name'], expectedData.item5);
    });

    it('Should handle /items endpoint with params: limit=1&page=2&sort=name&users[p]=name', async () => {
      await testInstance.generateTest(
        '/items',
        ['limit=1', 'page=2', 'sort=name', 'users[p]=name'],
        expectedData.item6
      );
    });

    // TODO: Manage the skip parameter
    // it("Should handle /items endpoint with params: skip=2", async () => {
    //   await testInstance.generateTest("/items", ["skip=2"], expectedData.item7);
    // });

    it('Should handle /items endpoint with params: sort=-_id', async () => {
      await testInstance.generateTest('/items', ['sort=-_id'], expectedData.item8);
    });

    // TODO: Manage the skip parameter
    // it("Should handle /items endpoint with params: skip=1&limit=2", async () => {
    //   await testInstance.generateTest("/items", ["skip=1", "limit=2"], expectedData.item9);
    // });

    it('Should handle /items endpoint with params: variant[color]=Yellow', async () => {
      await testInstance.generateTest('/items', ['variant[color]=Yellow'], expectedData.item10);
    });

    it('Should handle /items endpoint with params: sort=-variant.color', async () => {
      await testInstance.generateTest('/items', ['sort=-variant.color'], expectedData.item11);
    });

    it('Should handle /items endpoint with params: variant[users][p]=name', async () => {
      await testInstance.generateTest('/items', ['variant[users][p]=name'], expectedData.item12);
      console.log(expectedData.item12);
    });

    it('Should handle /items endpoint with params: variant[size]=Medium&variant[users][p]=name', async () => {
      await testInstance.generateTest(
        '/items',
        ['variant[size]=Medium', 'variant[users][p]=name'],
        expectedData.item13
      );
    });
  });
});
