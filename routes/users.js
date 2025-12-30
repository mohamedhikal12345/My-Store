const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");

const createUserSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  deleveryAddress: Joi.string().min(5).required(),
});

router.post("/newUser", async (req, res) => {
  const { name, email, password, deleveryAddress } = req.body;

  const joiValidation = createUserSchema.validate(req.body);
  if (joiValidation.error) {
    return res.status(400).json({ message: joiValidation.error.details[0].message });
  }

  const user = await User.findOne({ email: email });
  if (user) {
    return res.status(400).json({ message: "User is already exist" });
  }
  const hashPass = await bcrypt.hash(password, 10);
  const newUser = new User({
    name: name,
    email: email,
    password: hashPass,
    deleveryAddress: deleveryAddress,
  });

  await newUser.save();
  //   console.log(newUser);

  const token = generateToken({
    _id: newUser._id,
    name: newUser.name,
    role: newUser.role,
  });
  res.status(201).json(token);
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.password) {
      return res.status(500).json({ message: "Password not found in database" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = generateToken({
      _id: user._id,
      name: user.name,
      role: user.role,
    });
    res.json(token);

    // const { password: _, ...userWithoutPassword } = user.toObject();
    // res.status(200).json({
    //   message: "Login successful",
    //   user: userWithoutPassword,
    //   token,
    // });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  // const user = req.user;
  const user = await User.findById(req.user._id);
  res.json(user);
});
const generateToken = (data) => {
  return jwt.sign(data, process.env.JWT_KEY);
};
//don't forget to make the token expired
// { expiresIn: "2h",  }

module.exports = router;
