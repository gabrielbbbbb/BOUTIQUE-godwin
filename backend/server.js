const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sert le frontend statique
app.use(express.static(path.join(__dirname, "public")));

// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err));

// Routes API
app.use("/api/products", require("./routes/products"));

app.use("/api/admin", require("./routes/admin"));

// Fallback pour SPA (si tu utilises React ou une navigation JS)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Démarrage serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));

/* const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    allowedHeaders: ["Content-Type", "x-admin-password"],
  })
);
app.options("*", cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Serve uploaded images
app.use("/uploads", express.static(uploadsDir));

// MongoDB setup
mongoose.set("strictQuery", false);

// Product model
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

//stokage Cloudinary
// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "produits",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage });

// Middleware for admin routes
function requireAdmin(req, res, next) {
  const pass = req.headers["x-admin-password"];
  if (process.env.ADMIN_PASSWORD && pass === process.env.ADMIN_PASSWORD)
    return next();
  return res
    .status(401)
    .json({ message: "Unauthorized (invalid admin password header)" });
}

// Admin login endpoint
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: "Invalid password" });
});

// Serve frontend files
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

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

app.post(
  "/api/products",
  requireAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const { name, description, price, brand, category } = req.body;

      // Cloudinary renvoie des URLs publiques dans req.files[i].path
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
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

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

      if (req.files && req.files.length > 0) {
        const newImgs = req.files.map((f) => `/uploads/${f.filename}`);
        product.images = (product.images || []).concat(newImgs);
      }

      Object.assign(product, updates);
      await product.save();
      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// delete product (admin)
app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

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

app.use("/api/products", require("./routes/products"));

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
 */
