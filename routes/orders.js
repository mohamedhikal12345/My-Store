const express = require("express");
const router = express.Router();
const authMiddleWare = require("../middlewares/auth");
const axios = require("axios");
const checkRole = require("../middlewares/checkRole");
const { paypal, getAccessToken } = require("../config/paypal");
const Cart = require("../models/cart");
const Order = require("../models/order");

router.post("/paypal/create-order", authMiddleWare, async (req, res) => {
  try {
    const shippingAddress = req.body.shippingAddress;
    if (!shippingAddress) {
      return res.status(400).json({ message: "please provide your delivery address!" });
    }
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart not found" });
    }
    const token = await getAccessToken();

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "Shopping Cart Order",
          amount: {
            currency_code: "USD",
            value: cart.totalCartPrice,
          },
        },
      ],
      application_context: {
        return_url: "http://127.0.0.1:5500/paypalTesting.html",
        cancel_url: "http://127.0.0.1:5500/paypalTesting.html?cancel=true",
      },
    };

    const response = await axios.post(`${paypal.baseUrl}/v2/checkout/orders`, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const approvalUrl = response.data.links.find((link) => link.rel === "approve").href;
    res.json({ approvalUrl });
  } catch (error) {
    console.error("Error creating PayPal order:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: "PayPal order creation failed" });
  }
});

router.post("/paypal/capture-order", authMiddleWare, async (req, res) => {
  const { orderId } = req.body;
  const shippingAddress = req.body.shippingAddress;
  if (!shippingAddress) {
    return res.status(400).json({ message: "please provide your delivery address!" });
  }

  if (!orderId) {
    return res.status(400).json({ message: "Missing order ID!" });
  }

  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${paypal.baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Prefer: "return=representation",
        },
      }
    );

    if (response.data.status === "COMPLETED") {
      const cart = await Cart.findOne({ user: req.user._id });

      const newOrder = new Order({
        user: req.user._id,
        products: cart.products,
        totalProducts: cart.totalCartPrice,
        shippingAddress: shippingAddress,
        // paymentStatus: "paid",
        paymentId: response.data.id,
      });

      await newOrder.save();
      await cart.deleteOne();
      res.json({
        id: response.data.id,
        status: response.data.status,
        payer: response.data.payer,
        purchase_units: response.data.purchase_units,
      });
    } else {
      return res.status(400).json({
        status: "NOT COMPLETED",
        message: "Payment doesn't captured successfully. Try again later!",
      });
    }
  } catch (error) {
    console.error("PayPal capture error:", error.response?.data || error.message);

    res.status(error.response?.status || 500).json(error.response?.data || { message: "PayPal capture failed" });
  }
});
router.get("/", authMiddleWare, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).select("-user -shippingAddress -paymentId");

  res.json(orders);
});
router.patch("/order-status/:orderId", authMiddleWare, checkRole("admin"), async (req, res) => {
  const status = req.body.status;
  const updateOrder = await Order.findByIdAndUpdate(req.params.orderId, { orderStatus: status }, { new: true });

  if (!updateOrder) {
    res.status(404).json({ message: "Order not found" });
  }
  res.json({ message: " Order Status updated  successfully", updateOrder });
});
module.exports = router;
