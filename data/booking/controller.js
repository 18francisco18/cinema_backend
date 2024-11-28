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


async function createBooking(req, res, next) {
    try {
        const booking = req.body;
        const { id } = req.params;
        const newBooking = await bookingService.create(booking, id);
        res.status(201).send(newBooking);
    } catch (error) {
        next(error);
    }
}

async function findAllBookings(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = {};

    // Adicionar filtros de consulta
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.user) {
      query.user = req.query.user;
    }

    if (req.query.session) {
      query.session = req.query.session;
    }


    const result = await bookingService.findAll(page, limit, query);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

async function findAllBookingsForSession(req, res, next) {
    try {
        const { sessionId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await bookingService.findAllBookingsForSession(sessionId, page, limit);
        res.status(200).send(result);
    } catch (error) {
        next(error);
    }
}


// Controlador para buscar uma reserva pelo id
async function getBookingById(req, res, next) {
    try {
        const { id } = req.params;
        const booking = await bookingService.findById(id);
        res.status(200).send(booking);
    } catch (error) {
       next(error);
    }
}


// Controlador para remover uma reserva pelo id
async function removeBookingById(req, res, next) {
    try {
        const { id } = req.params;
        await bookingService.removeById(id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

// Controlador para atualizar uma reserva pelo id
async function updateBookingById(req, res, next) {
    try {
        const { id } = req.params;
        const booking = req.body;
        const updatedBooking = await bookingService.updateById(id, booking);
        res.status(200).send(updatedBooking);
    }
    catch (error) {
        next(error);
    }
}


async function handlePaymentConfirmation(paymentIntentId, next) {
    try {
        await bookingService.handlePaymentConfirmation(paymentIntentId);
    } catch (error) {
        console.error("Erro ao confirmar pagamento:", error.message);
        next(error);
    }
}


// Controlador para cancelar uma reserva
async function cancelReservation(req, res, next) {
    try {
        const { id } = req.params;
        await bookingService.cancelReservation(id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

async function refundTicketsFromBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const { ticketIds } = req.body;
    await bookingService.refundTickets(bookingId, ticketIds);
    res.status(200).send();
  } catch (error) {
    console.log(error);
    next(error);
  }
}




module.exports = bookingController;