const Ticket = require('./tickets');
const TicketService = require('./service');

const ticketService = TicketService(Ticket);
module.exports = ticketService;
