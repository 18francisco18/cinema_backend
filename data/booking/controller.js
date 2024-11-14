const bookingService = require('../booking');

const bookingController = {
    createBooking,
    findAllBookings,
    findAllBookingsForSession,
    getBookingById,
    removeBookingById,
    updateBookingById,
    handlePaymentConfirmation,
    cancelReservation,
    refundTicketsFromBooking,
}


async function createBooking(req, res) {
    try {
        const booking = req.body;
        const { id } = req.params;
        const newBooking = await bookingService.create(booking, id);
        res.status(201).send(newBooking);
    } catch (error) {
        next();
    }
}

async function findAllBookings(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await bookingService.findAll(page, limit);
    res.status(200).send(result);
  } catch (error) {
    next();
  }
}

async function findAllBookingsForSession(req, res) {
    try {
        const { sessionId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await bookingService.findAllBookingsForSession(sessionId, page, limit);
        res.status(200).send(result);
    } catch (error) {
        next();
    }
}


// Controlador para buscar uma reserva pelo id
async function getBookingById(req, res) {
    try {
        const { id } = req.params;
        const booking = await bookingService.findById(id);
        res.status(200).send(booking);
    } catch (error) {
       next();
    }
}


// Controlador para remover uma reserva pelo id
async function removeBookingById(req, res) {
    try {
        const { id } = req.params;
        await bookingService.removeById(id);
        res.status(204).send();
    } catch (error) {
        next();
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
        next();
    }
}


async function handlePaymentConfirmation(paymentIntentId) {
    try {
        await bookingService.handlePaymentConfirmation(paymentIntentId);
    } catch (error) {
        console.error("Erro ao confirmar pagamento:", error.message);
        next();
    }
}


// Controlador para cancelar uma reserva
async function cancelReservation(req, res) {
    try {
        const { id } = req.params;
        await bookingService.cancelReservation(id);
        res.status(204).send();
    } catch (error) {
        next();
    }
}

async function refundTicketsFromBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const { ticketIds } = req.body;
    await bookingService.refundTickets(bookingId, ticketIds);
    res.status(200).send();
  } catch (error) {
    console.log(error);
    next();
  }
}




module.exports = bookingController;