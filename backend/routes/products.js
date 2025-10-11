const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { cloudinary } = require("../utils/cloudinary");
const Product = require("../models/Product");
const streamifier = require("streamifier");

// Multer config (stockage en mémoire)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Fonction utilitaire pour uploader une image vers Cloudinary
function uploadToCloudinary(fileBuffer, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        public_id: publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

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
    const images = [];

    for (const file of req.files) {
      const imageUrl = await uploadToCloudinary(file.buffer, uuidv4());
      images.push(imageUrl);
    }

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
    console.error("Erreur backend:", err);
    res.status(400).json({ error: "Erreur d'ajout", details: err.message });
  }
});

// PUT update product
router.put("/:id", upload.array("images", 4), async (req, res) => {
  try {
    const { name, description, price, brand, category } = req.body;
    const images = [];

    for (const file of req.files) {
      const imageUrl = await uploadToCloudinary(file.buffer, uuidv4());
      images.push(imageUrl);
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, brand, category, images },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Erreur de mise à jour:", err);
    res
      .status(400)
      .json({ error: "Erreur de mise à jour", details: err.message });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur de suppression" });
  }
});

module.exports = router;
