require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// CORS: allow custom header x-admin-password
app.use(
  cors({
    origin: true,
    allowedHeaders: ["Content-Type", "x-admin-password"],
  })
);
app.options("*", cors());

app.use(express.json());

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// serve uploaded images
app.use("/uploads", express.static(uploadsDir));

// Mongoose / Product model
mongoose.set("strictQuery", false);
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: Number,
    brand: String,
    category: String,
    images: [String], // array of "/uploads/filename"
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", ProductSchema);

// multer config (store files in /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});
const upload = multer({ storage });

// simple admin check middleware using header x-admin-password
function requireAdmin(req, res, next) {
  const pass = req.headers["x-admin-password"];
  if (process.env.ADMIN_PASSWORD && pass === process.env.ADMIN_PASSWORD)
    return next();
  return res
    .status(401)
    .json({ message: "Unauthorized (invalid admin password header)" });
}

// Routes
app.get("/api/products", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

app.get("/api/products/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json(p);
});

// create product (admin) - up to 4 images
app.post(
  "/api/products",
  requireAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const { name, description, price, brand, category } = req.body;
      const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
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
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// update product (admin) - new images appended (if any)
app.put(
  "/api/products/:id",
  requireAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const updates = {};
      const { name, description, price, brand, category } = req.body;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (price !== undefined) updates.price = price;
      if (brand !== undefined) updates.brand = brand;
      if (category !== undefined) updates.category = category;

      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Not found" });

      // append uploaded images if any
      if (req.files && req.files.length > 0) {
        const newImgs = req.files.map((f) => `/uploads/${f.filename}`);
        product.images = (product.images || []).concat(newImgs);
      }

      // apply other updates
      Object.assign(product, updates);
      await product.save();
      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// delete product (admin) — also delete image files from disk
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    // delete images from disk
    for (const imgPath of product.images || []) {
      const full = path.join(__dirname, imgPath);
      if (fs.existsSync(full)) {
        try {
          fs.unlinkSync(full);
        } catch (e) {
          console.warn("Could not delete", full, e);
        }
      }
    }

    await product.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// connect to mongo and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message || err);
  });
