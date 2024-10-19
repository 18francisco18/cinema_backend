const ticketModel = require('./tickets');
const booking = require('../booking');

function TicketService(ticketModel) {
    let service = {
        create,
        findById,
        findAll,
        removeById,
        verifyQRCode,
    };

    async function create(ticket) {
        try {
            let newTicket = new ticketModel(ticket);
            let savedTicket = await newTicket.save();
            return savedTicket;
        } catch (error) {
            console.log(error);
            throw new Error(`Error creating ticket: ${error.message}`);
        }
        
    }

    async function findById(id) {
        try {
            let ticket = await ticketModel.findById(id);
            return ticket;
        } catch (error) {
            console.log(error);
            throw new Error(`Error finding ticket: ${error.message}`);
        }
    }

    async function findAll() {
        try {
            let tickets = await ticketModel.find();
            return tickets;
        } catch (error) {
            console.log(error);
            throw new Error(`Error finding tickets: ${error.message}`);
        }
    }

    async function removeById(id) {
        try {
            let ticket = await ticketModel.findByIdAndDelete(id);
            return ticket;
        } catch (error) {
            console.log(error);
            throw new Error(`Error deleting ticket: ${error.message}`);
        }
    }

    async function verifyQRCode(reservationId) {
        try {
            const ticket = await ticketModel.findById(reservationId);

            if (!ticket) {
                return res.status(404).json({ message: 'Ticket not found' });
            }

            if (ticket.status === 'used') {
                return res.status(400).json({ message: 'Ticket has already been used' });
            }

            if (ticket.status === 'cancelled') {
                return res.status(400).json({ message: 'Ticket has been cancelled' });
            }

            // Marcar o bilhete como usado
            ticket.status === "used";
            await ticket.save();

            return res.status(200).json({ message: 'Ticket verified successfully' });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Internal server error', error });
        }
    }

    


    return service;
}

module.exports = TicketService;