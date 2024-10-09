const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const seatStatus = require('./seatStatus');
const sessionStatus = require('./sessionStatus');

const seatStatusSchema = new Schema({
  seat: { type: String, required: true },
  status: {
    type: String,
    enum: [seatStatus.available, seatStatus.reserved, seatStatus.occupied, seatStatus.inaccessible],
    default: seatStatus.available,
  },
});

const sessionSchema = new Schema({
  room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true },
  date: { type: Date, required: true },
  price: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: [sessionStatus.available, sessionStatus.cancelled, sessionStatus.finished, sessionStatus.inProgress, sessionStatus.soldOut],
    default: sessionStatus.available,
  },
  seats: [[seatStatusSchema]],
});

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;