const express = require("express");
const router = express.Router();
const multer = require("multer");
const Category = require("../models/category");
const authMiddleware = require("../middlewares/auth");
const checkRole = require("../middlewares/checkRole");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload/category");
  },
  filename: (req, file, cb) => {
    const timeStamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.-]/g, "");
    cb(null, `${timeStamp}-${originalName}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. only PNG ,JPEG ,GIF are allowed "), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

router.post("/", authMiddleware, checkRole("admin"), upload.single("icon"), async (req, res) => {
  if (!req.body.name || !req.file) {
    return res.status(400).json({ message: "Name and icon are required!!" });
  }
  console.log(req.file);
  const newCategory = new Category({
    name: req.body.name,
    image: req.file.filename,
  });
  await newCategory.save();
  res.status(201).json({ message: "Category added succesfully", category: newCategory });
});

router.get("/", async (req, res) => {
  const categories = await Category.find().sort("name");
  res.json(categories);
});

module.exports = router;
