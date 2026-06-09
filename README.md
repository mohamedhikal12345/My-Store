<div align="center">

# 🛍️ My Store

### A full-featured e-commerce REST API built with Node.js, Express & MongoDB

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![PayPal](https://img.shields.io/badge/PayPal-Payments-003087?style=for-the-badge&logo=paypal&logoColor=white)](https://developer.paypal.com/)
[![Passport](https://img.shields.io/badge/Passport-OAuth2-34E27A?style=for-the-badge&logo=passport&logoColor=white)](http://www.passportjs.org/)

**[📖 API Docs](#-api-reference)** · **[🐛 Report Bug](https://github.com/mohamedhikal12345/my-store/issues)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 📌 Overview

**My Store** is a production-ready RESTful API for a fully functional e-commerce platform. It supports JWT-based authentication, Google & Facebook OAuth2 login, product and category management with image uploads, a shopping cart system, PayPal payment integration, and order management with status tracking. Errors and events are logged persistently using Winston with a MongoDB transport.

---

## ✨ Features

- 🔐 **Authentication** — Register, login with JWT; Google & Facebook OAuth2 via Passport.js
- 🛒 **Shopping Cart** — Add products, view cart, increase quantity, remove items
- 📦 **Products** — Create, fetch, search, and delete products with image uploads
- 🗂️ **Categories** — Organize products by category with image support
- 💳 **PayPal Payments** — Sandbox-ready PayPal Checkout integration
- 📋 **Orders** — View order history and update order status
- 🛡️ **Security** — JWT auth, bcrypt password hashing, Joi validation, CORS
- 📊 **Logging** — Winston with Console, File, and MongoDB transports
- 🖼️ **File Uploads** — Multer for product and category images, served as static files

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5.x |
| Database | MongoDB (Mongoose) |
| Auth | JWT + Passport.js (Google & Facebook OAuth2) |
| Payments | PayPal Checkout Server SDK |
| Validation | Joi |
| File Uploads | Multer |
| HTTP Client | Axios |
| Security | bcrypt, CORS |
| Logging | Winston + winston-mongodb |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- A [PayPal Developer](https://developer.paypal.com/) account (for payments)
- Google & Facebook OAuth2 credentials (for social login)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/mohamedhikal12345/my-store.git
cd my-store
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Fill in the required values in `.env` (see [Environment Variables](#-environment-variables)).

4. **Run the development server**

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

---

## 🔑 Environment Variables

Create a `.env` file in the root directory. **Never commit real credentials to version control.**

```env
# Authentication
JWT_KEY=your_jwt_secret_key

# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth2
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# Database
MONGO_URI=mongodb://localhost:27017/myStore

# Server
PORT=3000
```

> ⚠️ For production, switch `PAYPAL_BASE_URL` to `https://api-m.paypal.com`.

---

## 📖 API Reference

> **Base URL:** `http://localhost:3000`

Protected routes require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

---

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/google` | Initiate Google OAuth2 login | ❌ |
| `GET` | `/google/callback` | Google OAuth2 callback | ❌ |
| `GET` | `/facebook` | Initiate Facebook OAuth2 login | ❌ |
| `GET` | `/facebook/callback` | Facebook OAuth2 callback | ❌ |

---

### 👤 Users — `/api/user`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/login` | Login and receive JWT token | ❌ |

---

### 📦 Products — `/api/products`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Create a new product | ✅ |
| `GET` | `/` | Get all products | ❌ |
| `GET` | `/:id` | Get a single product | ❌ |
| `GET` | `/search` | Search products | ❌ |
| `DELETE` | `/:id` | Delete a product | ✅ |

---

### 🗂️ Categories — `/api/category`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Create a new category | ✅ |
| `GET` | `/` | Get all categories | ❌ |

---

### 🛒 Cart — `/api/cart`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/` | Add products to cart | ✅ |
| `GET` | `/` | Get user's cart | ✅ |
| `DELETE` | `/increase` | Increase product quantity in cart | ✅ |
| `DELETE` | `/:productId` | Remove a product from cart | ✅ |

---

### 📋 Orders — `/api/order`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Get order history | ✅ |
| `PATCH` | `/:orderId` | Update order status | ✅ |

---

## 📁 Project Structure

```
my-store/
├── server.js                   # Entry point
├── routes/
│   ├── users.js                # User routes
│   ├── auth.js                 # OAuth2 auth routes
│   ├── categories.js           # Category routes
│   ├── products.js             # Product routes
│   ├── cart.js                 # Cart routes
│   └── orders.js               # Order routes
├── config/
│   └── passport.js             # Passport.js Google & Facebook strategies
├── upload/
│   ├── category/               # Category images (static)
│   └── products/               # Product images (static)
├── logs/
│   └── errors.log              # Error log file
├── .env.example
├── package.json
└── README.md
```

---

## 📜 License

This project is licensed under the **ISC License**.

---

<div align="center">

Made with ❤️ by [Mohamed Hikal](https://github.com/mohamedhikal12345)

</div>
