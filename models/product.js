const mongoose = require("mongoose");

// const reviewSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   rate: { type: Number, required: true, min: 1, max: 5 },
//   comment: { type: String },
// });

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, minlength: 50 },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  images: { type: [String], required: true },
  review: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      rate: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String },
    },
  ],
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
