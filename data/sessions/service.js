const axios = require("axios");
const { MOVIE_API_BASE_URL, MOVIE_API_KEY } = require("../../api");
//Variável da rooms
const RoomModel = require("../rooms");
const Room = require("../rooms/rooms");
const Session = require("./sessions");

function sessionService(sessionModel) {
  let service = {
    create,
    findAll,
    checkAvailability,
    confirmPayment,
    cancelPayment,
    showSeatsAvailable,
    occupySeat,
    confirmSeat,
    releaseSeat,
  };

  // Função para criar uma sessão, copiando o layout da Room para os assentos da Session
  async function create(
    roomId,
    movieId,
    date,
    price,
    startTime,
    endTime
  ) {
    try {
      // Buscar o layout da Room pelo ID
      const room = await Room.findById(roomId);
      if (!room) {
        console.log(room);
        throw new Error("Room not found");
      }

      // Acessar o layout de assentos da Room e mapear para a Session
      const seatLayout = room.layout.map((row) => {
        return row.map((seat) => ({
          seatNumber: seat.number,
          status: "available", // Define o estado inicial como 'available'
        }));
      });

      // Criar uma nova sessão e associar o layout de assentos
      const session = new Session({
        room: roomId,
        movie: movieId,
        date: date,
        price: price,
        startTime: startTime,
        endTime: endTime,
        seats: seatLayout, // Assentos copiados diretamente do layout da Room
      });

      // Salvar a nova sessão no banco de dados
      await session.save();
      return session;
    } catch (error) {
      console.error(error);
      throw new Error("Erro ao criar a sessão com os assentos da sala");
    }
  }

  // Função para buscar todas as sessões no banco de dados
  async function findAll() {
    try {
      const sessions = await sessionModel.find();
      return sessions;
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao buscar as sessões: ${error.message}`);
    }
  }

  // Função para verificar a disponibilidade de assentos em uma sessão
  async function checkAvailability(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      let room = await RoomModel.findById(session.room);
      let tickets = await sessionModel.findById(sessionId).populate("tickets");

      let availableSeats = room.seats - tickets.length;
      return availableSeats;
    } catch (error) {
      console.log(error);
      throw new Error(`Error checking availability: ${error.message}`);
    }
  }

  async function confirmPayment(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      let updatedSession = session;
      updatedSession = await sessionModel.findByIdAndUpdate(
        sessionId,
        { paymentConfirmed: true },
        { new: true }
      );
      return updatedSession;
    } catch (error) {
      console.log(error);
      throw new Error(`Error confirming payment: ${error.message}`);
    }
  }

  async function cancelPayment(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      let updatedSession = session;
      updatedSession = await sessionModel.findByIdAndUpdate(
        sessionId,
        { paymentConfirmed: false },
        { new: true }
      );
      return updatedSession;
    } catch (error) {
      console.log(error);
      throw new Error(`Error cancelling payment: ${error.message}`);
    }
  }

  async function showSeatsAvailable(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      let room = await RoomModel.findById(session.room);
      let tickets = await sessionModel.findById(sessionId).populate("tickets");

      let availableSeats = room.seats - tickets.length;
      return availableSeats;
    } catch (error) {
      console.log(error);
      throw new Error(`Error showing available seats: ${error.message}`);
    }
  }

  async function occupySeat(sessionId, seat) {
    try {
      let session = await sessionModel.findById(sessionId);
      let updatedSession = session;
      updatedSession = await sessionModel.findByIdAndUpdate(
        sessionId,
        { $push: { occupiedSeats: seat } },
        { new: true }
      );
      return updatedSession;
    } catch (error) {
      console.log(error);
      throw new Error(`Error occupying seat: ${error.message}`);
    }
  }

  async function confirmSeat(sessionId, seat) {
    try {
      let session = await sessionModel.findById(sessionId);
      let updatedSession = session;
      updatedSession = await sessionModel.findByIdAndUpdate(
        sessionId,
        { $push: { confirmedSeats: seat } },
        { new: true }
      );
      return updatedSession;
    } catch (error) {
      console.log(error);
      throw new Error(`Error confirming seat: ${error.message}`);
    }
  }

  async function releaseSeat(sessionId, seat) {
    try {
      let session = await sessionModel.findById(sessionId);
      let updatedSession = session;
      updatedSession = await sessionModel.findByIdAndUpdate(
        sessionId,
        { $pull: { confirmedSeats: seat } },
        { new: true }
      );
      return updatedSession;
    } catch (error) {
      console.log(error);
      throw new Error(`Error releasing seat: ${error.message}`);
    }
  }

  return service;
}

module.exports = sessionService;
