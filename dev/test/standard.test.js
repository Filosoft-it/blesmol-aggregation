const request = require('supertest');
const serverApp = require('../index_dev'); // Import the app instance for testing

// Database and models
const database = require('../database/db');
const User = require('../database/models/user.model');
const Item = require('../database/models/item.model');

// Utils
const Test = require('../utils/test.util');

const app = serverApp.app;

// Main test suite
describe('API Tests', () => {
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
    expectedData.user12 = await User.find({}).sort('name email');
    expectedData.user13 = await User.find({}).sort({ name: 1, email: -1 });
    expectedData.user14 = await User.find({ name: 'Inatius' });

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
    expectedData.item14 = await Item.find({ externalId: { $gt: 101 } });
    expectedData.item15 = await Item.find({ externalId: { $ne: 101 } });
    expectedData.item16 = await Item.find({ externalId: { $ne: 101 }, 'variant.size': 'Medium' });
    expectedData.item17 = await Item.find({ name: 'Sample Item' });
    expectedData.item18 = await Item.find({ externalId: { $lt: 50 } });
    expectedData.item19 = await Item.find({ externalId: { $gt: 100 } }).sort('externalId');
    expectedData.item20 = await Item.find({ category: 'Electronics' });
    expectedData.item21 = await Item.find({ category: 'Electronics' }).limit(5);
    expectedData.item22 = await Item.find({ category: 'Electronics' }).sort({ externalId: -1 });
    expectedData.item23 = await Item.find({ name: { $in: ['Headphones', 'Laptop'] } });
    expectedData.item24 = await Item.find({ name: { $nin: ['Smartphone'] } });
    expectedData.item25 = await Item.find({ createAt: { $gte: new Date('2023-01-01T00:00:00.000Z') } });
    expectedData.item26 = await Item.find({ updateAt: { $lte: new Date('2023-12-31T00:00:00.000Z') } });
    expectedData.customSettingItem1 = await Item.find({}).select('-name -createAt');
    expectedData.customSettingItem2 = await Item.find({})
      .populate('users', '-name -createAt')
      .select('-name -createAt');
    expectedData.customSettingItem3 = await await Item.find({
      'translations.it.description': 'Cuffie over-ear con cancellazione del rumore'
    })
      .limit(1)
      .select('-name -createAt');
    expectedData.customSettingItem4 = await await Item.find({
      'translations.en.description': 'Noise-cancelling over-ear headphones'
    })
      .limit(1)
      .select('-name -createAt');
    expectedData.customSettingItem5 = await Item.find({}).select('-name -createAt');
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

  describe('API Endpoints no configuration', () => {
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

    it('Should handle /users endpoint with params: sort=name;email', async () => {
      await testInstance.generateTest('/users', ['sort=name;email'], expectedData.user12);
    });
    it('Should handle /users endpoint with params: sort=name;-email', async () => {
      await testInstance.generateTest('/users', ['sort=name;-email'], expectedData.user13);
    });
    it('Should handle /users when a params contain a command like "in": name:Inatius', async () => {
      await testInstance.generateTest('/users', ['name=Inatius'], expectedData.user14);
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

    it('Should handle /items endpoint with params: variant.color=Yellow', async () => {
      await testInstance.generateTest('/items', ['variant.color=Yellow'], expectedData.item10);
    });

    it('Should handle /items endpoint with params: sort=-variant.color', async () => {
      await testInstance.generateTest('/items', ['sort=-variant.color'], expectedData.item11);
    });

    it('Should handle /items endpoint with params: variant[users][p]=name', async () => {
      await testInstance.generateTest('/items', ['variant[users][p]=name'], expectedData.item12);
    });

    it('Should handle /items endpoint with params: variant.users[p]=name', async () => {
      await testInstance.generateTest('/items', ['variant.users[p]=name'], expectedData.item12);
    });

    it('Should handle /items endpoint with params: variant[size]=Medium&variant[users][p]=name', async () => {
      await testInstance.generateTest(
        '/items',
        ['variant[size]=Medium', 'variant[users][p]=name'],
        expectedData.item13
      );
    });

    it('Should handle /items endpoint with params: variant.size=Medium&variant.users[p]=name', async () => {
      await testInstance.generateTest('/items', ['variant[size]=Medium', 'variant.users[p]=name'], expectedData.item13);
    });

    it('Should handle /items endpoint with params: externalId[gt]=101', async () => {
      await testInstance.generateTest('/items', ['externalId[gt]=101'], expectedData.item14);
    });

    it('Should handle /items endpoint with params: externalId[ne]=101', async () => {
      await testInstance.generateTest('/items', ['externalId[gt]=101'], expectedData.item15);
    });

    it('Should handle /items endpoint with params: externalId[ne]=101&variant[size]=Medium', async () => {
      await testInstance.generateTest('/items', ['externalId[ne]=101', 'variant[size]=Medium'], expectedData.item16);
    });

    it('Should handle /items endpoint with params: externalId[ne]=101&variant.size=Medium', async () => {
      await testInstance.generateTest('/items', ['externalId[ne]=101', 'variant.size=Medium'], expectedData.item16);
    });

    it('Should handle /items endpoint with params: name=Sample Item', async () => {
      await testInstance.generateTest('/items', ['name=Sample Item'], expectedData.item17);
    });

    it('Should handle /items endpoint with params: externalId[lt]=50', async () => {
      await testInstance.generateTest('/items', ['externalId[lt]=50'], expectedData.item18);
    });

    it('Should handle /items endpoint with params: externalId[gt]=100&sort=externalId', async () => {
      await testInstance.generateTest('/items', ['externalId[gt]=100', 'sort=externalId'], expectedData.item19);
    });

    it('Should handle /items endpoint with params: category=Electronics', async () => {
      await testInstance.generateTest('/items', ['category=Electronics'], expectedData.item20);
    });

    it('Should handle /items endpoint with params: category=Electronics&limit=5', async () => {
      await testInstance.generateTest('/items', ['category=Electronics', 'limit=5'], expectedData.item21);
    });

    it('Should handle /items endpoint with params: category=Electronics&sort=-externalId', async () => {
      await testInstance.generateTest('/items', ['category=Electronics', 'sort=-externalId'], expectedData.item22);
    });

    it('Should handle /items endpoint with params: name[in]=Headphones;Laptop', async () => {
      await testInstance.generateTest('/items', ['name[in]=Headphones;Laptop'], expectedData.item23);
    });

    it('Should handle /items endpoint with params: name[nin]=Smartphone', async () => {
      await testInstance.generateTest('/items', ['name[nin]=Smartphone'], expectedData.item24);
    });

    it('Should handle /items endpoint with params: createAt[gte]=2023-01-01T00:00:00.000Z"', async () => {
      await testInstance.generateTest('/items', ['createAt[gte]=2023-01-01T00:00:00.000Z'], expectedData.item25);
    });

    it('Should handle /items endpoint with params: updateAt[lte]=2023-12-31T00:00:00.000Z (Check if the body.data.length is a number)', async () => {
      const results = await testInstance.generateTest(
        '/items',
        ['updateAt[lte]=2023-12-31T00:00:00.000Z'],
        expectedData.item26
      );
      if (typeof results.body.data.length !== 'number') {
        throw new Error('results.body.data.length should be a number');
      }
    });
  });

  describe('API Endpoints with custom settings', () => {
    it('Should handle /custom-settings/items endpoint without params', async () => {
      await testInstance.generateTest('/custom-settings/items', [], expectedData.customSettingItem1);
    });

    it('Should handle /custom-settings/items endpoint with params: users[p]=*', async () => {
      await testInstance.generateTest('/custom-settings/items', ['users[p]=*'], expectedData.customSettingItem2);
    });

    it('Should handle /custom-settings/items endpoint with params: limit=1&lang=it&description=Cuffie over-ear con cancellazione del rumore', async () => {
      await testInstance.generateTest(
        '/custom-settings/items',
        ['limit=1', 'lang=it', 'description=Cuffie over-ear con cancellazione del rumore'],
        expectedData.customSettingItem3
      );
    });

    it('Should handle /custom-settings/items endpoint with params: limit=1&lang=de&description=Noise-cancelling over-ear headphones', async () => {
      await testInstance.generateTest(
        '/custom-settings/items',
        ['limit=1', 'lang=de', 'description=Noise-cancelling over-ear headphones'],
        expectedData.customSettingItem4
      );
    });

    it('Should handle /custom-settings/items endpoint with params: (Check if the body.results is null)', async () => {
      const results = await testInstance.generateTest('/custom-settings/items', [''], expectedData.customSettingItem5);
      if (results.body.results !== null) {
        throw new Error('results.body.results should be null');
      }
    });
  });
});
