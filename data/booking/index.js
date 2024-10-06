const booking = require("./booking");
const BookingService = require("./service");

const bookingService = BookingService(booking)
module.exports = bookingService;
