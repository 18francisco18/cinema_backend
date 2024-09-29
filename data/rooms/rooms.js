let mongoose = require("mongoose");
let Schema = mongoose.Schema;

let roomSchema = new Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
});

let Room = mongoose.model("Room", roomSchema);
module.exports = Room;