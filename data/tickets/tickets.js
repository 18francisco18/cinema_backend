const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Booking = require('../booking/booking');

const ticketSchema = new Schema({
  booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  seat: {
    seatNumber: { type: String, required: true }, 
  },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["booked", "used", "cancelled"],
    default: "booked",
  },
  qrCode: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
});

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
