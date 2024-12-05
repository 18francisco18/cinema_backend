const RoomModel = require("../rooms");
const Room = require("../rooms/rooms");
const Session = require("./sessions");
const Movie = require("../movies/movies");
const seatStatus = require("./seatStatus");
const sessionStatus = require("./sessionStatus");
const sessionReport = require("./sessionReport");
const booking = require("../booking/booking");
const ticketModel = require("../tickets/tickets");
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
} = require("../../AppError");

function SessionService(sessionModel) {
  let service = {
    createSession,
    findAll,
    findByMovie,
    deleteSession,
    findById,
    checkAvailability,
    checkAndUpdateSessions,
    cancelSession,
    deleteSessions,
    applyUnavailabilityToSeats,
    generateSessionReport,
    getAllSessionReports,
    getReportFromSession,
  };

  // Função para criar uma sessão, copiando o layout da Room para os assentos da Session
  // O create possui este formato pois é extremamente importante verificar a existencia
  // dos ids de Room e Movie e garantir a cópia dos assentos de uma sala antes de criar a Session.
  // Não só serve para garantir a integridade dos dados e evitar erros de referência, como também
  // aplicar mais facilmente restrições no processo de criação.
  async function createSession(roomId, movieId, date, price, startTime, endTime) {
    try {
      // Buscar o layout da Room pelo ID
      const room = await Room.findById(roomId);
      if (!room) throw new NotFoundError("Room not found");

      const movie = await Movie.findById(movieId);
      if (!movie) throw new NotFoundError("Movie not found");

      // Verificar se já existe uma sessão com o mesmo filme, sala e data
      const existingSession = await Session.findOne({
        room: roomId,
        movie: movieId,
        date: date,
        startTime: startTime,
        endTime: endTime,
      });

      if (existingSession) {
        throw new ValidationError(
          "Session already exists for the same movie, room, and time"
        );
      }

      // Acessar o layout de assentos da Room e mapear para a Session
      const seatLayout = room.layout.map((row) => {
        return row.map((seat) => ({
          seat: seat.number,
          status:
            seat.status === seatStatus.inaccessible // Se o assento da sala for inacessível
              ? seatStatus.inaccessible // Assentos inacessíveis da sala são refletidos na sessão
              : seatStatus.available, // Assentos disponíveis começam como 'available'
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

      // Adicionar o ID da sessão ao array "sessions" na Room
      room.sessions.push(session._id);
      await room.save();

      return session;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Função para buscar todas as sessões
  // falta fazer paginação e sorting.
  async function findAll(page = 1, limit = 10, movieId = null) {
    try {
      const skip = (page - 1) * limit;
      const query = movieId ? { movie: movieId } : {};
      const sessions = await Session.find(query)
        .skip(skip)
        .limit(limit)
        .populate("room", "name") // Popula apenas o nome da sala
        .populate("movie", "title") // Popula apenas o título do filme
        .sort({ date: 1, startTime: 1 }); // Ordena por data e hora
      const total = await Session.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      if (!sessions) throw new DatabaseError("Error finding all sessions");
      if (sessions.length === 0) throw new NotFoundError("No sessions found");
      if (page > totalPages) {
        return { sessions: [], total: 0, page, limit };
      }

      return {
        sessions,
        total,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Função específica para buscar sessões por filme
  async function findByMovie(movieId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const sessions = await Session.find({ movie: movieId })
        .skip(skip)
        .limit(limit)
        .populate("room", "name")
        .populate("movie", "title")
        .sort({ date: 1, startTime: 1 });

      const total = await Session.countDocuments({ movie: movieId });
      const totalPages = Math.ceil(total / limit);

      if (!sessions)
        throw new DatabaseError("Error finding sessions for movie");
      if (sessions.length === 0)
        throw new NotFoundError("No sessions found for this movie");
      if (page > totalPages) {
        throw new ValidationError(
          `Invalid page. Total pages available: ${totalPages}`
        );
      }

      return {
        sessions,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function deleteSession(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) {
        throw new NotFoundError("Session not found");
      }
      await sessionModel.findByIdAndDelete(sessionId);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function findById(sessionId) {
    try {
      const session = await Session.findById(sessionId)
        .populate("movie", "title poster")
        .populate("room", "name capacity");

      if (!session) {
        throw new NotFoundError("Session not found");
      }

      // Gerar matriz de assentos se ainda não existir
      if (!session.seats || session.seats.length === 0) {
        const totalSeats = session.room.capacity;
        const rows = Math.ceil(Math.sqrt(totalSeats));
        const seatsPerRow = Math.ceil(totalSeats / rows);

        const seats = [];
        let seatNumber = 1;

        for (let row = 0; row < rows; row++) {
          const rowSeats = [];
          for (
            let col = 0;
            col < seatsPerRow && seatNumber <= totalSeats;
            col++
          ) {
            rowSeats.push({
              seat: `${String.fromCharCode(65 + row)}${col + 1}`,
              status: "available",
            });
            seatNumber++;
          }
          seats.push(rowSeats);
        }

        session.seats = seats;
        await session.save();
      }

      return session;
    } catch (error) {
      throw error;
    }
  }

  // Função para cancelar uma sessão manualmente. A razão para existir um método de cancelamento
  // manual é para permitir que o administrador do sistema possa cancelar uma sessão
  // por qualquer motivo que não seja a falta de vendas (irá ser feito método automático para tal).
  async function cancelSession(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) throw new NotFoundError("Session not found");

      const currentTime = new Date();

      // Calcular o tempo de início da sessão e o tempo limite (1 hora antes do início)
      const startTime = session.startTime;
      const oneHourBeforeStart = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hora antes do startTime

      if (session.status === sessionStatus.cancelled) {
        throw new ValidationError("Session already cancelled");
      }

      if (session.status === sessionStatus.finished) {
        throw new ValidationError("Session already finished");
      }

      // Verificar se a sessão pode ser cancelada
      if (currentTime > oneHourBeforeStart) {
        throw new ValidationError(
          "Cannot cancel the session less than 1 hour before the start time."
        );
      }

      const cancelledSession = await sessionModel.findByIdAndUpdate(sessionId, {
        status: sessionStatus.cancelled,
      });
      return cancelledSession;
    } catch (error) {
      console.log(error);
      throw error;
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

  // Rever esta função
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
      const updatedSession = await Session.updateMany(
        // Se endTime for menor que a hora atual ($lt - lesser than) e status diferente de "finished" ou "cancelled" ($nin - not in)
        // então atualiza o status para "finished" ($set - set field)
        {
          endTime: { $lt: currentTime },
          status: { $nin: [sessionStatus.finished, sessionStatus.cancelled] },
        },
        { $set: { status: sessionStatus.finished } }
      );

      // Gerar relatório de sessão para cada sessão finalizada
      for (let i = 0; i < updatedSession.n; i++) {
        await generateSessionReport(updatedSession[i]._id);
      }

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

  // Função para buscar todos os relatórios de sessão com paginação e filtros
  async function getAllSessionReports(page = 1, limit = 10, filters = {}) {
    try {
      const skip = (page - 1) * limit;
  
      // Buscar relatórios de sessão com filtros e paginação
      const reports = await sessionReport.find(filters).skip(skip).limit(limit);
  
      if (reports.length === 0) {
        return {
          reports: [],
          totalReports: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        };
      }
  
      const totalReports = await sessionReport.countDocuments(filters);
      const totalPages = Math.ceil(totalReports / limit);
  
      return {
        reports,
        totalReports,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (error) {
      console.error("Erro ao buscar relatórios de sessão", error);
      throw error;
    }
  }

  // Função para aplicar indisponibilidade a assentos específicos de uma sessão
  async function applyUnavailabilityToSeats(sessionId, seatNumbers) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) throw new NotFoundError("Session not found");
      if (
        session.status === sessionStatus.finished ||
        session.status === sessionStatus.cancelled
      ) {
        throw new ValidationError(
          "Cannot apply unavailability to seats for a finished or cancelled session"
        );
      }

      // Obter o layout de assentos da sessão
      const seatLayout = session.seats;

      // Para cada número de assento fornecido, encontrar o assento correspondente
      // e definir o status como "inaccessible"
      seatNumbers.forEach((seatNumber) => {
        // Percorrer o layout de assentos e encontrar o assento correspondente
        for (let i = 0; i < seatLayout.length; i++) {
          for (let j = 0; j < seatLayout[i].length; j++) {
            if (seatLayout[i][j].seat === seatNumber) {
              // Definir o status do assento como "inaccessible"
              seatLayout[i][j].status = seatStatus.inaccessible;
            } else {
              throw new NotFoundError("Seat not found in session");
            }
          }
        }
      });

      // Atualizar o layout de assentos da sessão
      session.seats = seatLayout;
      await session.save();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Função para gerar um relatório de sessão
  async function generateSessionReport(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      // Buscar as reservas associadas à sessão
      let bookings = await booking.find({ session: sessionId });
      if (!bookings || bookings.length === 0) {
        throw new Error("Bookings not found");
      }

      // Obter os bilhetes vendidos para a sessão
      let tickets = await ticketModel.find({
        booking: { $in: bookings.map((booking) => booking._id) },
      });
      console.log(tickets);

      // Calcular o total de bilhetes vendidos
      const ticketsSold = tickets.reduce((count, ticket) => {
        if (ticket.status === "booked") {
          return count + 1;
        }
        return count;
      }, 0);

      // Calcular o total de bilhetes vendidos para todas as sessões
      const totalTicketsSold = await ticketModel.countDocuments();

      // Calcular o total de cancelamentos
      const cancellationsTotal = tickets.filter(
        (ticket) => ticket.status === "cancelled"
      ).length;

      // Calcular o total de cancelamentos por período
      const cancellationsPeriods = {
        before2Hours: tickets.filter(
          (ticket) =>
            (ticket.status === "cancelled" || ticket.status === "refunded") &&
            ticket.cancelledAt &&
            ticket.cancelledAt.getTime() - session.startTime.getTime() >
              2 * 60 * 60 * 1000
        ).length,
        between2HoursAnd30Minutes: tickets.filter(
          (ticket) =>
            (ticket.status === "cancelled" || ticket.status === "refunded") &&
            ticket.cancelledAt &&
            ticket.cancelledAt.getTime() - session.startTime.getTime() <=
              2 * 60 * 60 * 1000 &&
            ticket.cancelledAt.getTime() - session.startTime.getTime() >
              30 * 60 * 1000
        ).length,
        after30Minutes: tickets.filter(
          (ticket) =>
            (ticket.status === "cancelled" || ticket.status === "refunded") &&
            ticket.cancelledAt &&
            ticket.cancelledAt.getTime() - session.startTime.getTime() <=
              30 * 60 * 1000
        ).length,
      };

      // Calcular o montante total gerado com bilhetes
      const ticketAmountGenerated = ticketsSold * session.price;

      // Calcular o montante total gerado com cancelamentos
      const cancellationAmountGenerated = cancellationsTotal * session.price;

      // Calcular o montante total gerado
      const totalAmountGenerated =
        ticketAmountGenerated - cancellationAmountGenerated;

      // Calcular o valor total dos produtos vendidos nas reservas da sessão
      const totalProductsSold = bookings.reduce((total, booking) => {
        return total + booking.products.length;
      }, 0);

      // Calcular o valor total dos produtos vendidos em todas as reservas da sessão
      const totalProductsAmountGenerated = await booking.aggregate([
        { $match: { session: session._id } },
        { $unwind: "$products" },
        { $group: { _id: null, total: { $sum: "$products.price" } } },
      ]);

      // Calcular o total de assentos não vendidos
      const seatsUnsold = session.seats
        .flat()
        .filter((seat) => seat.status === "available").length;

      // Criar um novo relatório de sessão com os dados calculados
      const newSessionReport = new sessionReport({
        sessionId: sessionId,
        sessionTicketPrice: session.price,
        ticketsSold: ticketsSold,
        totalTicketsSold: totalTicketsSold,
        cancellationsTotal: cancellationsTotal,
        cancellationsPeriods: cancellationsPeriods,
        ticketAmountGenerated: ticketAmountGenerated,
        cancellationAmountGenerated: cancellationAmountGenerated,
        totalAmountGenerated: totalAmountGenerated,
        totalProductsSold: totalProductsSold,
        totalProductsAmountGenerated: totalProductsAmountGenerated[0].total,
        seatsUnsold: seatsUnsold,
      });

      console.log(newSessionReport);

      // Salvar o relatório de sessão no banco de dados
      await newSessionReport.save();

      return newSessionReport;
    } catch (error) {
      console.log(error);

      if (error.message === "Session not found") {
        throw new Error("Session not found");
      }

      throw new Error(`Error generating session report: ${error.message}`);
    }
  }

  // Função para buscar um relatório de sessão a partir do ID da sessão
  async function getReportFromSession(sessionId) {
    try {
      let session = await sessionModel.findById(sessionId);
      if (!session) {
        throw new NotFoundError("Session not found");
      }
      let report = await sessionReport.find({ sessionId: session });
      if (!report) {
        throw new NotFoundError("Report not found");
      }
      return report;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  return service;
}

module.exports = SessionService;
