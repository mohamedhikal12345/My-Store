const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
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
  totalPrice: { type: Number, default: 0 },
  shippingAddress: { type: String, require: true },
  paymentId: { type: String, require: true },
  orderStatus: {
    type: String,
    enum: ["pending", "processing", "shipped", "deleverd", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now() },
  deleveredAt: { type: Date },
});
const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
