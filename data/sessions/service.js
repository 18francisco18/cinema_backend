const RoomModel = require("../rooms");
const Room = require("../rooms/rooms");
const Session = require("./sessions");
const Movie = require("../movies/movies");
const seatStatus = require("./seatStatus");
const sessionStatus = require("./sessionStatus");

function sessionService(sessionModel) {
  let service = {
    create,
    findAll,
    deleteSession,
    findById,
    checkAvailability,
    checkAndUpdateSessions,
    cancelSession,
    deleteSessions,
    applyUnavaliabilityToSeats,
  };

  // Função para criar uma sessão, copiando o layout da Room para os assentos da Session
  // O create possui este formato pois é extremamente importante verificar a existencia
  // dos ids de Room e Movie e garantir a cópia dos assentos de uma sala antes de criar a Session.
  // Não só serve para garantir a integridade dos dados e evitar erros de referência, como também
  // aplicar mais facilmente restrições no processo de criação.
  async function create(roomId, movieId, date, price, startTime, endTime) {
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
          seat: seat.number,
          status: seat.status === seatStatus.inaccessible // Se o assento da sala for inacessível
            ? seatStatus.inaccessible // Assentos inacessíveis da sala são refletidos na sessão
            : seatStatus.available // Assentos disponíveis começam como 'available'
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

  async function findById(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      return session;
    } catch (error) {
      console.log(error);
      throw new Error(`Error finding session by id: ${error.message}`);
    }
  }


  // Função para cancelar uma sessão manualmente. A razão para existir um método de cancelamento
  // manual é para permitir que o administrador do sistema possa cancelar uma sessão 
  // por qualquer motivo que não seja a falta de vendas (irá ser feito método automático para tal).
  async function cancelSession(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const currentTime = new Date();

      // Calcular o tempo de início da sessão e o tempo limite (1 hora antes do início)
      const startTime = session.startTime;
      const oneHourBeforeStart = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hora antes do startTime


      if (session.status === sessionStatus.cancelled) {
        throw new Error("Session already cancelled");
      }

      if (session.status === sessionStatus.finished) {
        throw new Error("Session already finished");
      }

      // Verificar se a sessão pode ser cancelada
      if (currentTime > oneHourBeforeStart) {
        throw new Error(
          "Cannot cancel the session less than 1 hour before the start time."
        );
      }

      await sessionModel.findByIdAndUpdate(sessionId, { status: sessionStatus.cancelled });
    }
    catch (error) {
      console.log(error);

      if (error.message === "Session not found") {
        throw new Error("Session not found");
      }

      if (error.message === "Cannot cancel the session less than 1 hour before the start time.") {
        throw new Error("Cannot cancel the session less than 1 hour before the start time.");
      }

      if (error.message === "Session already cancelled") {
        throw new Error("Session already cancelled");
      }

      if (error.message === "Session already finished") {
        throw new Error("Session already finished");
      }

      throw new Error(`Error cancelling session: ${error.message}`);
    }
  }

  // Função para eliminar todas as sessões terminadas ou canceladas que já terminaram 
  // uma hora depois de endTime.
  // Utilizado node-cron para agendar a execução desta função a cada 5 minutos.
  async function deleteSessions() {
    try {
      const currentTime = new Date();
      await Session.deleteMany({
        endTime: { $lt: new Date(currentTime.getTime() - 60 * 60 * 1000) }, // 1 hora atrás
        status: { $in: [sessionStatus.finished, sessionStatus.cancelled] },
      });
    } catch (error) {
      console.log(error);
      throw new Error(`Error deleting all sessions: ${error.message}`);
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

  // Função para verificar e encerrar sessões automaticamente
  // ATENÇÃO: Esta função deve ser chamada periodicamente para verificar e atualizar as sessões
  // para tal, será utilizado o node-cron para agendar a execução desta função!
  // A utilização do node-cron deverá ser feita no inicializador da aplicação (app.js) para ser
  // executado automáticamente em intervalos regulares!
  // Para mais informação de node-cron, consultar documentação 
  // em https://www.npmjs.com/package/node-cron
  async function checkAndUpdateSessions() {
    try {
      // Obter a data e hora atuais
      const currentTime = new Date();

      // Atualiza sessões finalizadas
      await Session.updateMany(
        // Se endTime for menor que a hora atual ($lt - lesser than) e status diferente de "finished" ou "cancelled" ($nin - not in)
        // então atualiza o status para "finished" ($set - set field)
        { endTime: { $lt: currentTime }, status: { $nin: [sessionStatus.finished, sessionStatus.cancelled] } },
        { $set: { status: sessionStatus.finished } }
      );

      // Atualiza sessões em progresso
      // Se startTime for menor que a hora atual ($lt - lesser than) e endTime for maior que a hora atual ($gt - greater than)
      // e status apenas for igual a "available" ou "in progress" e não for igual a "cancelled",
      // então atualiza o status para "in progress" ($set - set field)
      await Session.updateMany(
        {
          startTime: { $lt: currentTime },
          endTime: { $gt: currentTime },
          status: { $in: [sessionStatus.available, sessionStatus.inProgress] },
          status: { $nin: [sessionStatus.cancelled] },
        },
        { $set: { status: sessionStatus.inProgress } }
      );

      console.log("Sessões atualizadas com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar sessões", error);
      throw new Error("Erro ao verificar e atualizar sessões");
    }
  }

  // Função para aplicar indisponibilidade a assentos específicos de uma sessão
  async function applyUnavaliabilityToSeats(sessionId, seatNumbers) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Obter o layout de assentos da sessão
      const seatLayout = session.seats;

      // Para cada número de assento fornecido, encontrar o assento correspondente
      // e definir o status como "inaccessible"
      session.seats.forEach((seatNumber) => {
        // Percorrer o layout de assentos e encontrar o assento correspondente
        for (let i = 0; i < seatLayout.length; i++) {
          for (let j = 0; j < seatLayout[i].length; j++) {
            if (seatLayout[i][j].seat === seatNumber) {
              // Definir o status do assento como "inaccessible"
              seatLayout[i][j].status = seatStatus.inaccessible;
            }
          }
        }
      });

      // Atualizar o layout de assentos da sessão
      await sessionModel.findByIdAndUpdate(sessionId, { seats: seatLayout });
    }
    catch (error) {
      console.log(error);

      if (error.message === "Session not found") {
        throw new Error("Session not found");
      }

      throw new Error(`Error applying unavailability to seats: ${error.message}`);
    } 
  }

  return service;
}

module.exports = sessionService;
