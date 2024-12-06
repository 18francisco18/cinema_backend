const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const type = [
    'one-time',
    'multiple'
]

const discountType = [
    'percentage',
    'fixed'
]

const promocodeSchema = new Schema({
    code: { type: String, required: true },
    user : { type: Schema.Types.ObjectId, ref: 'User' },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    discount: { type: Number, required: true },
    type: { type: String, enum: type, required: true },
    discountType: { type: String, enum: discountType, required: true },
    maxUsage: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    active: { type: Boolean, default: true }
});

const Promocode = mongoose.model('Promocode', promocodeSchema);
module.exports = Promocode;
