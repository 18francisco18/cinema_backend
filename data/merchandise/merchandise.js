const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const merchandiseSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  points: { type: Number, required: true },
  image: { type: String, required: true },
});

const Merchandise = mongoose.model("Merchandise", merchandiseSchema);
module.exports = Merchandise;
