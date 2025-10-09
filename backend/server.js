import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./config/cloudinary.js";

dotenv.config();

// ======= Setup Paths =======
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ======= Middleware =======
app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "x-admin-password"],
  })
);
app.use(express.json());

// ======= MongoDB =======
mongoose.set("strictQuery", false);
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: Number,
    brand: String,
    category: String,
    images: [String],
  },
  { timestamps: true }
);
const Product = mongoose.model("Product", ProductSchema);

// ======= Admin Check =======
function requireAdmin(req, res, next) {
  const pass = req.headers["x-admin-password"];
  if (process.env.ADMIN_PASSWORD && pass === process.env.ADMIN_PASSWORD)
    return next();
  return res.status(401).json({ message: "Unauthorized" });
}

// ======= Cloudinary Upload =======
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "boutique-godwin",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
  },
});
const upload = multer({ storage });

// ======= API ROUTES =======

// 🟢 Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🟢 Get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🟢 Admin login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD)
    return res.json({ success: true });
  return res.status(401).json({ success: false, message: "Invalid password" });
});

// 🟢 Create product
app.post(
  "/api/products",
  requireAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const { name, description, price, brand, category } = req.body;
      const images = (req.files || []).map((f) => f.path);

      const product = await Product.create({
        name,
        description,
        price,
        brand,
        category,
        images,
      });
      res.status(201).json(product);
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🟢 Update product
app.put(
  "/api/products/:id",
  requireAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const { name, description, price, brand, category } = req.body;
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Not found" });

      if (req.files && req.files.length > 0) {
        const newImgs = req.files.map((f) => f.path);
        product.images = (product.images || []).concat(newImgs);
      }

      Object.assign(product, { name, description, price, brand, category });
      await product.save();
      res.json(product);
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🟢 Delete product
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    await product.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ======= Debug Route (optional) =======
app.get("/api/debug", async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error checking product count" });
  }
});

// ======= Serve Frontend =======

// ✅ Serve the frontend (adjust path)
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendPath, "index.html"));
  }
});

/* app.use(express.static(path.join(__dirname, "frontend")));

// Serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
  } else {
    res.status(404).json({ message: "API route not found" });
  }
}); */

// ======= Start Server =======
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message || err);
  });

/* // server.js

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./config/cloudinary.js";
//import router from "./routes/api.js";

const app = express();

// ======= Cloudinary Storage Setup =======
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "boutique-godwin", // Folder in your Cloudinary account
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
  },
});
const upload = multer({ storage });

// ======= Middleware =======
app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "x-admin-password"],
  })
);
app.use(express.json());

// ======= MongoDB Setup =======
mongoose.set("strictQuery", false);
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: Number,
    brand: String,
    category: String,
    images: [String], // Stores Cloudinary URLs
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);

// ======= Admin Check Middleware =======
function requireAdmin(req, res, next) {
  const pass = req.headers["x-admin-password"];
  if (process.env.ADMIN_PASSWORD && pass === process.env.ADMIN_PASSWORD)
    return next();
  return res.status(401).json({ message: "Unauthorized" });
}

// ======= Serve Frontend =======
//app.use(express.static(path.join(process.cwd(), "frontend")));

//const frontendPath = path.join(__dirname, "..", "frontend");
//app.use(express.static(frontendPath));

// ✅ Serve API routes first (above frontend)
//app.use("/api", router); // if you are using router, or just keep your routes directly

// ✅ Serve frontend only for non-API routes
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "frontend")));

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
  }
});

/*app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ======= Routes =======

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 Admin Login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: "Invalid password" });
  }
});

// ➕ Create product (with Cloudinary images)
app.post(
  "/api/products",
  requireAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const { name, description, price, brand, category } = req.body;

      // Cloudinary URLs
      const images = (req.files || []).map((f) => f.path);

      const product = await Product.create({
        name,
        description,
        price,
        brand,
        category,
        images,
      });

      res.status(201).json(product);
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ✏️ Update product (add or modify images)
app.put(
  "/api/products/:id",
  requireAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const { name, description, price, brand, category } = req.body;
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Not found" });

      // Add new Cloudinary URLs
      if (req.files && req.files.length > 0) {
        const newImgs = req.files.map((f) => f.path);
        product.images = (product.images || []).concat(newImgs);
      }

      Object.assign(product, { name, description, price, brand, category });
      await product.save();
      res.json(product);
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ❌ Delete product
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    await product.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ======= Connect MongoDB & Start Server =======
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message || err);
  });

//ajoute

app.get("/api/debug", async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error checking product count" });
  }
});
//jjsdkjsk

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});
 */
