const ticketService = require('../tickets');

const ticketsController = {
    verifyTicketQRCode,
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


module.exports = ticketsController;





