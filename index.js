require("dotenv").config();
require("./config/passport");
require("winston-mongodb");
const { error } = require("console");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const winston = require("winston");
const path = require("path");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console({
      level: "debug",
    }),
    new winston.transports.File({
      filename: "logs/errors.log",
      level: "error",
    }),
    new winston.transports.MongoDB({
      db: "mongodb://localhost:27017/myStore",
      level: "error",
    }),
  ],
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
  logger.on("finish", () => {
    process.exit(1);
  });
  logger.end();
});
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled promise rejection ", err);
  logger.on("finish", () => {
    process.exit(1);
  });
  logger.end();
});

mongoose
  .connect("mongodb://localhost:27017/myStore")
  .then(() => logger.info("MongoDB Connected Succefully"))
  .catch((err) => {
    logger.error("MongoDB connection failed", err);
    logger.on("finish", () => {
      process.exit(1);
    });
    logger.end();
  });

app.use(express.json());
app.use("/upload/category", express.static("upload/category"));
app.use("/upload/products", express.static("upload/products"));

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/products", productRoutes);
app.use((error, req, res, next) => {
  console.log("Error middleware is running");
  logger.error(error.message, {
    method: req.method,
    path: req.originalUrl,
    stack: error.stack,
  });
  res.status(500).json({ message: "Internal Server Error!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is listening on port ${PORT}......`);
});
