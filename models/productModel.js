const mongoose = require("mongoose");

const productItemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
});

// Create the Restaurant model
const product = mongoose.model("products", productItemsSchema);

module.exports = product;
