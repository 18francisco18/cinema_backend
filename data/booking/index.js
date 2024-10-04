const booking = require("./booking");
const bookingService = require("./service");

const bookingService = bookingService(booking)
module.exports = bookingService;
