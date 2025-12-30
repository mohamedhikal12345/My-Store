const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const Product = require("../models/product");
const Cart = require("../models/cart");
const mongoose = require("mongoose");

router.post("/:productId", authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;
    const userId = req.user._id;

    if (!productId || !quantity) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: "Stock is not enough" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [],
        totalProducts: 0,
        totalCartPrice: 0,
      });
    }

    const existingProduct = cart.products.find(
      (p) => p.productId.toString() === productId.toString()
    );

    if (existingProduct) {
      if (existingProduct.quantity + quantity >= product.stock) {
        return res.status(400).json({ message: "Stock is not enough" });
      }
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({
        productId: productId,
        quantity: quantity,
        title: product.title,
        price: product.price,
        image: product.images[0],
      });
    }

    cart.totalProducts = cart.products.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
    //
    // cart.totalCartPrice = cart.products.reduce(
    //   (total, item) => total + item.price * item.quantity,
    //   0
    // );
    cart.totalCartPrice = cart.products.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );

    await cart.save();

    console.log("Cart saved successfully!");
    return res.status(200).json({
      message: "Product added to cart successfully ",
      cart,
    });
  } catch (err) {
    console.error("Error in add-to-cart route:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
});
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(400).json({ message: "Cart not found for this user." });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error("Error fetching cart", error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});
router.patch("/:productId/increase", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount = 1 } = req.body;
    const productId = req.params.productId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        products: [
          {
            productId: product._id,
            quantity: amount,
            title: product.title,
            price: product.price,
            image: product.images[0],
          },
        ],
        totalProducts: amount,
        totalCartPrice: product.price * amount,
      });

      await cart.save();
      return res.status(201).json({ message: "Cart created with product", cart });
    }

    const productInCart = cart.products.find((product) => {
      return product.productId.toString() === productId;
    });

    if (productInCart) {
      productInCart.quantity += amount;
    } else {
      cart.products.push({
        productId: productId,
        quantity: amount,
        title: product.title,
        price: product.price,
        image: product.images[0],
      });
    }
    cart.totalProducts = cart.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    cart.totalCartPrice = cart.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    await cart.save();

    res.json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error updating cart", error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});
router.patch("/:productId/decrease", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount = 1 } = req.body;
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const productInCart = cart.products.find((product) => {
      return product.productId.toString() === productId;
    });

    if (!productInCart)
      return res.status(404).json({ message: "Product not found in cart" });
    // prevent quantity form going below zero
    productInCart.quantity = Math.max(0, productInCart.quantity - amount);

    if (productInCart.quantity === 0) {
      cart.products = cart.products.filter(
        (product) => product.productId.toString() !== productId
      );
    }
    cart.totalProducts = cart.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    cart.totalCartPrice = cart.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    await cart.save();

    res.json({ message: "Product quantity decreased", cart });
  } catch (error) {
    console.error("Error decreasing product quantity", error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});
router.delete("/:productId/delete", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.params.productId;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(400).json({ message: "Cart not found" });
    }

    const productInCart = cart.products.find((product) => {
      return product.productId.toString() === productId;
    });

    if (!productInCart)
      return res.status(404).json({ message: "Product not found in cart" });

    cart.products = cart.products.filter((p) => p.productId.toString() !== productId);

    if (cart.products.length === 0) {
      await Cart.deleteOne({ user: userId });
      return res.status(200).json({ message: "Product removed, cart deleted (empty)" });
    }
    cart.totalProducts = cart.products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );
    cart.totalCartPrice = cart.products.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    await cart.save();

    return res
      .status(200)
      .json({ message: "Product successfully removed from cart", cart });
  } catch (error) {
    console.error("Error deleting product", error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
});

module.exports = router;
