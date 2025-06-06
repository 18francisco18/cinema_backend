const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stripeProductId: { type: String, required: true },
  stripePriceId: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  image: { type: String, required: true },
  stock: { type: Boolean, required: true, default: true },
  pointsRef: [{ type: Schema.Types.ObjectId, ref: "Points" }],
  discountRef: [{ type: Schema.Types.ObjectId, ref: "Discount", required: false }],
});

// Garantir que os índices sejam criados ao iniciar o sistema
productSchema.index({ name: 1 });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;