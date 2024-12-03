const ticketService = require('../tickets');

const ticketsController = {
    verifyTicketQRCode,
    getTicketById,
    getAllTickets,
}

async function verifyTicketQRCode(req, res, next) {
    try {
        const qrCodeData = req.body;
        const validationResult = await ticketService.validateQRCode(qrCodeData);
        res.status(200).json({ validationResult });
    } catch (error) {
        console.error(error.message);
        next(error);
    }
}

async function getTicketById(req, res, next) {
    try {
        const { id } = req.params;
        const ticket = await ticketService.findById(id);
        res.status(200).send(ticket);
    } catch (error) {
        next(error);
    }
}

async function getAllTickets(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const query = {};

        if (req.query.booking) {
            query.booking = req.query.booking;
        }

        if (req.query.ticketNumber) {
            query.ticketNumber = req.query.ticketNumber;
        }

        if (req.query.seat) {
          query.seat = req.query.seat;
        }

        if (req.query.status) {
          query.status = req.query.status;
        }

        if (req.query.issuedAt) {
          query.issuedAt = { $gte: new Date(req.query.issuedAt) };
        }




        const tickets = await ticketService.findAll(page, limit, query);
        res.status(200).send(tickets);
    } catch (error) {
        next(error);
    }
}


module.exports = ticketsController;





