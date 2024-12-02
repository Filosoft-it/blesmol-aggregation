const testUsers = [
  {
    _id: "user1",
    name: "John Doe",
    email: "john.doe@example.com",
    items: ["item1", "item3"],
    createAt: new Date("2023-11-01T09:00:00Z"),
    updateAt: new Date("2023-11-10T09:00:00Z"),
  },
  {
    _id: "user2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    items: ["item2"],
    createAt: new Date("2023-11-02T09:30:00Z"),
    updateAt: new Date("2023-11-12T09:30:00Z"),
  },
];

module.exports = { testUsers };