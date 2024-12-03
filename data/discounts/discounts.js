const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discountSchema = new Schema({
  productId: [{ type: Schema.Types.ObjectId, ref: "Product", required: false }], // Produto vinculado
  userId: { type: Schema.Types.ObjectId, ref: "User", required: false }, // Usuário específico (opcional)
  type: { type: String, enum: ["general", "product", "user"], required: true },
  percentOff: { type: Number, required: true },
  fixedAmountOff: { type: Number, required: false },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: false },
  description: { type: String, required: false },
  active: { type: Boolean, default: true },
  maxUsage: { type: Number, required: false },
  currentUsage: { type: Number, default: 0 },
});

const Discount = mongoose.model('Discount', discountSchema);
module.exports = Discount;