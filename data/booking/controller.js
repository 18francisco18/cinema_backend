const bookingService = require('../booking');

const bookingController = {
    createBooking,
    getBookingById,
    getAllBookings,
    removeBookingById,
    updateBookingById,
    handlePaymentConfirmation,
    cancelReservation,
}


async function createBooking(req, res) {
    try {
        const booking = req.body;
        const { id } = req.params;
        const newBooking = await bookingService.create(booking, id);
        res.status(201).send(newBooking);
    } catch (error) {
        if (error.message === "Check for missing fields or wrong fields") {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Controlador para buscar uma reserva pelo id
async function getBookingById(req, res) {
    try {
        const { id } = req.params;
        const booking = await bookingService.findById(id);
        res.status(200).send(booking);
    } catch (error) {
        if (error.message === "Booking not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

async function getAllBookings(req, res) {
    try {
        const bookings = await bookingService.findAll();
        res.status(200).send(bookings);
    } catch (error) {
        res.status(500).send(error);
    }
}

// Controlador para remover uma reserva pelo id
async function removeBookingById(req, res) {
    try {
        const { id } = req.params;
        await bookingService.removeById(id);
        res.status(204).send();
    } catch (error) {
        if (error.message === "Booking not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Controlador para atualizar uma reserva pelo id
async function updateBookingById(req, res) {
    try {
        const { id } = req.params;
        const booking = req.body;
        const updatedBooking = await bookingService.updateById(id, booking);
        res.status(200).send(updatedBooking);
    }
    catch (error) {
        if (error.message === "Booking not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}


async function handlePaymentConfirmation(paymentIntentId) {
    try {
        await bookingService.handlePaymentConfirmation(paymentIntentId);
    } catch (error) {
        console.error("Erro ao confirmar pagamento:", error.message);
    }
}


// Controlador para cancelar uma reserva
async function cancelReservation(req, res) {
    try {
        const { paymentIntentId } = req.params;
        await bookingService.cancelReservation(paymentIntentId);
        res.status(204).send();
    } catch (error) {
        if (error.message === "Booking not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}




module.exports = bookingController;