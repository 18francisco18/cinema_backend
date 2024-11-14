const ticketService = require('../tickets');

const ticketsController = {
    verifyTicketQRCode,
}

async function verifyTicketQRCode(req, res, next) {
    try {
        const { reservationId } = req.body;

        const ticket = await ticketService.verifyQRCode(reservationId);

        res.status(200).json({ ticket });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error verifying ticket' });
    }
}


module.exports = ticketsController;





