const ticketModel = require('./tickets');
const Booking = require('../booking/booking');
const QRCodeModel = require('../booking/qrcode');
const jwt = require('jsonwebtoken');
const User = require('../users/user');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
} = require("../../AppError");

function TicketService(ticketModel) {
    let service = {
        create,
        findById,
        findAll,
        removeById,
        validateQRCode,
    };

    async function create(ticket) {
        try {
            let newTicket = new ticketModel(ticket);
            let savedTicket = await newTicket.save();
            return savedTicket;
        } catch (error) {
            throw new DatabaseError(`Error creating ticket: ${error.message}`);
        }
        
    }

    async function findById(id) {
        try {
            let ticket = await ticketModel.findById(id);
            if (!ticket) throw new NotFoundError("Ticket not found");
            return ticket;
        } catch (error) {
            throw error;
        }
    }

    async function findAll(page = 1, limit = 10, filters = {}) {
      try {
        const skip = (page - 1) * limit;

        // Buscar tickets com filtros e paginação
        const tickets = await ticketModel.find(filters).skip(skip).limit(limit);

        if (!tickets) throw new DatabaseError("Tickets not found");
        if (tickets.length === 0) throw new NotFoundError("No tickets found");

        const totalTickets = await ticketModel.countDocuments(filters);
        const totalPages = Math.ceil(totalTickets / limit);

        return {
          tickets,
          totalTickets,
          totalPages,
          currentPage: page,
          limit,
        };
      } catch (error) {
        console.log(error);
        throw error;
      }
    }

    async function removeById(id) {
        try {
            let ticket = await ticketModel.findByIdAndDelete(id);
            if (!ticket) throw new NotFoundError("Ticket not found");
            return ticket;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function validateQRCode(qrCodeData) {
      try {
        const { qrCodeId, token } = qrCodeData;
        console.log("Validando QR Code:", qrCodeId, token);

        if (!qrCodeId || !token) throw new ValidationError("Dados inválidos");

        // Buscar QR Code no banco de dados
        const qrCode = await QRCodeModel.findOne({ qrCodeId });
        if (!qrCode) throw new ValidationError("QR Code inválido");
        if (qrCode.isRevoked) throw new ValidationError("QR Code revogado");
        if (qrCode.expirationDate < new Date()) throw new ValidationError("QR Code expirado");
        if (qrCode.remainingUses === 0) throw new ValidationError("QR Code já utilizado");
        
        const booking = await Booking.findById(qrCode.bookingId);
        if (!booking) throw new NotFoundError("Booking not found");
    

        // Decodificar o token e verificar consistência
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log("Token decodificado:", decoded);
        console.log("QR Code:", qrCode);
        if (decoded.qrData.qrCodeId !== qrCode.qrCodeId)
          throw new ValidationError("Token inconsistente");
        
        const user = await User.findById(booking.user);
        if (!user) throw new NotFoundError("User not found");

        // Incrementar número de usos
        qrCode.remainingUses -= 1;
        await qrCode.save();

        console.log("QR Code validado com sucesso");
        return { success: true, qrCode };
      } catch (error) {
        console.error("Erro ao validar QR Code:", error.message);
        throw error;
      }
    }

    


    return service;
}

module.exports = TicketService;