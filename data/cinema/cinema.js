const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cinemaSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
});

const Cinema = mongoose.model('Cinema', cinemaSchema);
module.exports = Cinema;