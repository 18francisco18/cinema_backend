const RoomModel = require("../rooms");
const Room = require("../rooms/rooms");
const Session = require("./sessions");
const Movie = require("../movies/movies");

function sessionService(sessionModel) {
  let service = {
    create,
    findAll,
    deleteSession,
    findSessionById,
    checkAvailability,
  };

  // Função para criar uma sessão, copiando o layout da Room para os assentos da Session
  // O create possui este formato pois é extremamente importante verificar a existencia
  // dos ids de Room e Movie e garantir a cópia dos assentos de uma sala antes de criar a Session.
  // Não só serve para garantir a integridade dos dados e evitar erros de referência, como também
  // aplicar mais facilmente restrições no processo de criação.
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
        throw new Error("Room not found");
      }

      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw new Error("Movie not found");
      }

      // Acessar o layout de assentos da Room e mapear para a Session
      // Para cada objeto "row", mapear cada objeto "seat" e retornar 
      // um objeto com o número do assento e o estado inicial
      const seatLayout = room.layout.map((row) => {
        return row.map((seat) => ({
          seatNumber: seat.number,
          status: "available", // Define o estado inicial como 'available'
        }));
      });

      // Criar uma nova sessão com os dados e associar o layout de assentos
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

      if (error.message === "Room not found") {
        throw new Error("Room not found");
      }

      if (error.message === "Movie not found") {
        throw new Error("Movie not found");
      }

      throw new Error("Internal server error");
    }
  }

  async function findAll() {
    try {
      let sessions = await sessionModel.find();
      return sessions;
    } catch (error) {
      console.log(error);
      throw new Error(`Error finding all sessions: ${error.message}`);
    }
  }

  async function deleteSession(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }
      await sessionModel.findByIdAndDelete(sessionId);
    } catch (error) {
      console.log(error);
      throw new Error(`Error deleting session: ${error.message}`);
    }
  }


  async function findSessionById(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      return session;
    } catch (error) {
      console.log(error);
      throw new Error(`Error finding session by id: ${error.message}`);
    }
  }

  
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


  return service;
}

module.exports = sessionService;
