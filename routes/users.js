const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");

// ─── VALIDATION SCHEMA ───
const createUserSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  deliveryAddress: Joi.string().min(5).required(),
});

// ─── HELPER FUNCTION ───
const generateToken = (data) => {
  return jwt.sign(data, process.env.JWT_KEY, { expiresIn: "2h" }); // ✅ Added expiration
};

// ─── REGISTER ───
router.post("/newUser", async (req, res) => {
  try {
    // ✅ Added try-catch
    const { name, email, password, deliveryAddress } = req.body;

    // Validate input
    const { error } = createUserSchema.validate(req.body); // ✅ Cleaner destructuring
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }); // ✅ Cleaner shorthand
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" }); // ✅ Fixed typo
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10); // ✅ Better variable name

    // Create new user
    const newUser = new User({
      name, // ✅ ES6 shorthand
      email,
      password: hashedPassword,
      deliveryAddress,
    });

    await newUser.save();

    // Generate token & respond
    const token = generateToken({
      _id: newUser._id,
      name: newUser.name,
      role: newUser.role,
    });

    res.status(201).json({ token }); // ✅ Wrapped in object
  } catch (err) {
    // ✅ Error handled
    res.status(500).json({ message: "Server error" });
  }
});

// ─── LOGIN ───
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user registered with social login (no password)
    if (!user.password) {
      return res.status(400).json({
        // ✅ Changed from 500 to 400
        message: "Please login with Google or Facebook", // ✅ Better message
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" }); // ✅ Changed to 401
    }

    // Generate token & respond
    const token = generateToken({
      _id: user._id,
      name: user.name,
      role: user.role,
    });

    res.status(200).json({ token }); // ✅ Added status 200 & wrapped in object
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── GET CURRENT USER ───
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" }); // ✅ Handle not found
    }
    res.status(200).json({ user }); // ✅ Wrapped in object
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
