const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    maxlength: 100,
  },
  items: {
    type: [String],
    required: true,
    ref: "Item",
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

const UsersModel = mongoose.model("User", usersSchema);
module.exports = UsersModel;