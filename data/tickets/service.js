const ticketModel = require('./tickets');
const booking = require('../booking');

function TicketService(ticketModel) {
    let service = {
        create,
        findById,
        findAll,
        removeById
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

    


    return service;
}

module.exports = TicketService;