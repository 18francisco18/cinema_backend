const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' }, // Para subcategorias
    createdAt: { type: Date, default: Date.now }
});


const Category = mongoose.model("Category", categorySchema);
module.exports = Category ;