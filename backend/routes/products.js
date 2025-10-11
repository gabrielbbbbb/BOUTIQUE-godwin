const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { storage } = require("../utils/cloudinary");
const Product = require("../models/Product");

const upload = multer({ storage });

// GET all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET one product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Introuvable" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST new product
router.post("/", upload.array("images", 4), async (req, res) => {
  try {
    const { name, description, price, brand, category } = req.body;
    const images = (req.files || []).map((file) => file.path);

    const newProduct = new Product({
      name,
      description,
      price,
      brand,
      category,
      images,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error("Erreur d'ajout:", err);
    res.status(500).json({ error: "Erreur d'ajout", details: err.message });
  }
});

// PUT update product
router.put("/:id", upload.array("images", 4), async (req, res) => {
  try {
    const { name, description, price, brand, category } = req.body;
    const updates = { name, description, price, brand, category };

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Introuvable" });

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      product.images = [...(product.images || []), ...newImages];
    }

    Object.assign(product, updates);
    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Erreur de mise à jour:", err);
    res
      .status(500)
      .json({ error: "Erreur de mise à jour", details: err.message });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Introuvable" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur de suppression" });
  }
});

module.exports = router;
