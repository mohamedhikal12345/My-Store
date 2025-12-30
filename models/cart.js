const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, required: true },
      title: String,
      price: Number,
      image: String,
    },
  ],
  totalProducts: { type: Number, default: 0 },
  totalCartPrice: { type: Number, default: 0 },
});

module.exports = mongoose.model("Cart", cartSchema);
