const { match } = require("assert");
const { kMaxLength } = require("buffer");
const { required } = require("joi");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: 3,
    kMaxLength: [50, "Name cannot be more than 50 charcter"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: [false, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
  },
  faceboodId: {
    type: String,
    unique: true,
  },
  deleveryAddress: { type: String, required: false },
  role: {
    type: String,
    enum: ["user", "seller", "admin"],
    default: "user",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
