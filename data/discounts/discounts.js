const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discountSchema = new Schema({
    id: { type: String },
    productName: { type: String, required: true },
    type: { type: String, enum: ["general", "individual"] ,required: true },
    duration: { type: String, enum: ["once", "repeating", "forever"], default: "once", required: true },
    durationInMonths: { type: Number, required: false },
    percentOff: { type: Number, required: true },
    description: { type: String, required: true },
    active: { type: Boolean, default: true },
});

const Discount = mongoose.model('Discount', discountSchema);
module.exports = Discount;