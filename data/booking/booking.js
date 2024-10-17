const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    seats: [{ type: String, required: true }], // Lista de assentos reservados
    date: { type: Date, default: Date.now }, // Data de criação da reserva
    status: {
        type: String,
        enum: ["active", "cancelled", "completed"],
        default: "active"
    },
    totalAmount: { type: Number, required: true }, // Valor total da reserva
    paymentStatus: {
        type: String,
        enum: ["paid", "pending", "cancelled"],
        default: "pending"
    },
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;