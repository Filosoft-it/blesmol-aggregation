const mongoose = require("mongoose");
const { create } = require('./user.model');

const itemsSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  users: {
    type: [String],
    required: true,
    ref: 'User'
  },
  variant: {
    color: {
      type: String,
      required: true
    },
    size: {
      type: String,
      required: true
    },
    users: {
      type: [String],
      required: true,
      ref: 'User'
    }
  },
  externalId: {
    type: Number,
    required: true
  },
  createAt: {
    type: Date,
    default: Date.now
  },
  updateAt: {
    type: Date,
    default: Date.now
  }
});

const ItemsModel = mongoose.model("Item", itemsSchema);
module.exports = ItemsModel;