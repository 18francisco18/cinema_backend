const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const merchandiseSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  poins: { type: Number, required: true },
  image: { type: String, required: true },
  stock: { type: Boolean, required: true },
});

const Merchandise = mongoose.model("Merchandise", merchandiseSchema);
module.exports = Merchandise;
