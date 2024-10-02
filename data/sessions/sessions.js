const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  tickets: [{ type: Schema.Types.ObjectId, ref: "Ticket" }],
  availableSeats: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ["available", "sold out", "cancelled"],
    default: "available",
  },
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;