const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;


const ticketSchema = new Schema({
  ticketNumber: { type: Number, unique: true },
  booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
  seat: { type: String, required: true },
  status: {
    type: String,
    enum: ["booked", "used", "cancelled", "refunded"],
    default: "booked",
  },
  issuedAt: { type: Date, default: Date.now },
});

ticketSchema.plugin(AutoIncrement, { inc_field: "ticketNumber" });

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
