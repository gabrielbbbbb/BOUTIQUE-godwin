// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    brand: { type: String },
    category: { type: String },
    images: [{ type: String }], // URLs Cloudinary
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
