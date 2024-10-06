const bodyParser = require("body-parser");
const express = require("express");
const bookingController = require("../data/booking/controller");

function BookingRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.post("/create", bookingController.createBooking);
    router.get("/find/:id", bookingController.getBookingById);
    router.get("/findAll", bookingController.getAllBookings);
    router.delete("/remove/:id", bookingController.removeBookingById);
    router.put("/update/:id", bookingController.updateBookingById);

    return router;
}

module.exports = BookingRouter;