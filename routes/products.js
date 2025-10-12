const express = require("express");
const authMiddleware = require("../middlewares/auth");
const checkRole = require("../middlewares/checkRole");
const router = express.Router();
const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const Product = require("../models/product");
const Category = require("../models/category");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "upload/products");
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

router.post("/", authMiddleware, checkRole("seller"), upload.array("images", 8), async (req, res) => {
  const { title, description, category, price, stock } = req.body;
  const images = req.files.map((image) => image.filename);

  if (images.length === 0) {
    return res.status(400).json({ message: "At least one image is required" });
  }

  const newProduct = new Product({
    title,
    description,
    category,
    price,
    stock,
    images,
    seller: req.user._id,
  });

  await newProduct.save();
  res.status(201).json(newProduct);
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 8;

    const queryCategory = req.query.category || null;
    const querySearch = req.query.search || null;
    let query = {};

    if (queryCategory) {
      const category = await Category.findOne({ name: queryCategory });

      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      query.category = category._id;
    }
    if (querySearch) {
      query.title = { $regex: querySearch, $options: "i" };
    }
    const products = await Product.find(query)
      .select("-description -seller -category -__v")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean();

    const updatedProducts = products.map((product) => {
      const sumOfRating = product.review.reduce((sum, review) => sum + review.rating, 0);
      const numberOfRevews = product.review.length;
      const averageRating = sumOfRating / (numberOfRevews || 1);

      return {
        ...product,
        images: product.images[0],
        review: { numberOfRevews, averageRating },
      };
    });

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);

    res.json({
      products: updatedProducts,
      totalProducts,
      totalPages,
      currentPage: page,
      postPerPage: perPage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

router.get("/suggestions", async (req, res, next) => {
  const search = req.query.search;
  const products = await Product.find({ title: { $regex: search, $options: "i" } })
    .select("_id title")
    .limit(10);
  res.json(products);
});

router.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id).populate("seller", "_id name email").populate("review.user", "_id name email").select("-category -__v");
  if (!product) {
    return res.status(404).json({ message: "Product  not found" });
  }
  res.json(product);
});
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).select("seller images");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // console.log(product.seller, req.user._id);
    if (req.user.role === "admin" || req.user._id === product.seller.toString()) {
      if (product.images && product.images.length > 0) {
        for (const imageName of product.images) {
          const fullPath = path.join(process.cwd(), "upload", "products", imageName);
          try {
            await fs.unlink(fullPath);
            console.log(`Deleted: ${fullPath}`);
          } catch (error) {
            console.error(`Error deleting file ${fullPath}`, error);
          }
        }
      }
      await product.deleteOne();

      return res.json({ message: "Product deleted successfully" });
    }
    return res.status(403).json({ message: "access denied: Only admin or seller can delete this product!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
