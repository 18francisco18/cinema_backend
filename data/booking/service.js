const sessionModel = require("../sessions/sessions");
const RoomModel = require("../rooms/rooms");
const bookingModel = require("./booking");
const userModel = require("../users/user");

function bookingService(bookingModel) {
  let service = {
      create,
      findById,
      findAll,
      removeById,
      updateById,
  };

  async function create(booking) {
    try {
      const session = await sessionModel.findById(booking.session).populate("room");
      if (!session) {
        throw new Error("Session not found");
      }

      const existingBooking = await bookingModel.findOne({
        session: booking.session,
        seat: booking.session.seats,
      });

      if (existingBooking) {
        throw new Error("This seat is already booked for the session");
      }

      // Verificar se a sala tem capacidade para novos assentos (se a sessão ainda está disponível)
      if (session.status === "sold out") {
        throw new Error("Session is already sold out");
      }

      if (session.status === "cancelled") {
          throw new Error("Session is cancelled");
      }

      if (session.status === "finished") {
          throw new Error("Session is finished");
      }
      
      if (new Date(session.date) < new Date()) {
        throw new Error("Cannot book a session in the past");
      }

      // Você pode adicionar aqui mais validações de assentos, como verificar se os assentos estão livres

      let newBooking = new bookingModel(booking);
      return await save(newBooking);
    } catch (error) {
      console.log(error);
      throw new Error(`Check for missing fields or wrong fields`);
    }
  }

  // Salva um modelo
  async function save(model) {
      return new Promise(function (resolve, reject) {
          model
              .save()
              .then(() => resolve(model))
              .catch((err) => reject(`There was a problem creating the booking ${err}`));
      });
  }

  async function findById(id) {
    try {
      const booking = await bookingModel
        .findById(id)
        .populate("user")
        .populate("room")
        .populate("session");
      if (!booking) {
        throw new Error("Booking not found");
      }
      return booking;
    } catch (err) {
      if (err.message === "Booking not found") {
        throw err;
      }
      throw new Error("Error fetching booking");
    }
  }

  // Encontra todas as reservas
  async function findAll() {
      try {
          const bookings = await bookingModel.find();
          return bookings;
      } catch (err) {
          throw new Error("Error fetching bookings");
      }
  }

  // Remove uma reserva por id
  async function removeById(id) {
      try {
          const booking = await bookingModel.findByIdAndDelete(id);
          if (!booking) {
              throw new Error("Booking not found");
          }
          return booking;
      } catch (err) {
          if (err.message === "Booking not found") {
              throw err;
          }
          throw new Error("Error removing booking");
      }
  }

  // Atualiza uma reserva por id
  async function updateById(id, booking) {
      try {
          const bookingUpdate = await bookingModel.findByIdAndUpdate(id, booking, { new: true });
          if (!bookingUpdate) {
              throw new Error("Booking not found");
          }
      }
      catch (error) {
          if (error.message === "Booking not found") {
              throw error;
          }
          throw new Error("Error updating booking");
      }
  }

  // Função para reservar assentos em uma sessão
  async function bookSession(sessionId, seats, userId) {
    try {
      // Verificar se a sessão existe
      let session = await sessionModel.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Verificar tickets presentes na sessão
      let tickets = await sessionModel.findById(sessionId).populate("tickets");

      let availableSeats = room.seats - tickets.length;
      if (availableSeats < seats) {
        throw new Error("Not enough seats available");
      }

      let user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      let newBooking = new bookingModel({
        session: session,
        user: user,
        seats: seats,
      });

      return await save(newBooking);
    }
    catch (error) {
      console.log(error);
      throw new Error(`Error booking session: ${error.message}`);
    }
  }

  return service;
}

module.exports = bookingService;