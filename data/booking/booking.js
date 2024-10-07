const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    date: { type: Date, required: true },

});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;