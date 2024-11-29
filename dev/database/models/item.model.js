const mongoose = require("mongoose");

const itemsSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  user: {
    type: String,
    required: true,
    ref: "Users",
  },
  externalId: {
    type: Number,
    required: true,
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

const ItemsModel = mongoose.model("Items", itemsSchema);
module.exports = ItemsModel;