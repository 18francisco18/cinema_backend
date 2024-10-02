let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const seatSchema = new Schema({
  number: { type: String, required: true }, 
  isAvailable: { type: Boolean, default: true }, 
});

let roomSchema = new Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  layout: [[seatSchema]],
  cinema: { type: Schema.Types.ObjectId, ref: "Cinema", required: true },
});

let Room = mongoose.model("Room", roomSchema);
module.exports = Room;