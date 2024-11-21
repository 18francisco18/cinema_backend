const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointsSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    points: { type: Number, required: true },
    type: { type: String, enum: ['discount', 'item'], required: true },
    expirationDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

const Points = mongoose.model('Points', pointsSchema);
module.exports = Points;