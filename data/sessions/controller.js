const sessionService = require('../sessions');

const sessionsController = {
    createSession,
    cancelSession,
    getSessions,
    getSessionById,
    deleteSession,
    checkAvailability,
    checkAndUpdateSessions,
    applyUnavaliabilityToSeats,
    getSessionsReport,
}

// Controlador para criar uma nova sessão
async function createSession(req, res, next) {
  try {
    const { room, movie, date, price, startTime, endTime } = req.body;

    // Chamar o serviço para criar uma sessão com os dados fornecidos
    const session = await sessionService.create(room, movie, date, price, startTime, endTime);

    // Se a sessão foi criada com sucesso, retornar a sessão criada
    res.status(201).json({
      message: 'Sessão criada com sucesso',
      session
    });
  } catch (error) {
    next(error);
  }
}

async function cancelSession(req, res, next) {
  try {
    const { id } = req.params;

    // Chamar o serviço para cancelar a sessão com o ID fornecido
    await sessionService.cancelSession(id);

    // Se a sessão foi cancelada com sucesso, retornar uma mensagem de sucesso
    res.status(200).json({ message: 'Sessão cancelada com sucesso' });
  } catch (error) {
    next(error);
  }
}

async function getSessions(req, res, next) {
  try {
    const sessions = await sessionService.findAll();
    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
}

async function getSessionById(req, res, next) {
  try {
    const { id } = req.params;
    const session = await sessionService.findById(id);
    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
}

async function deleteSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await sessionService.deleteSession(id);
    res.status(200).json({
      message: 'Session deleted successfully',
      session
    });
  } catch (error) {
    next(error);
  }
}

async function checkAvailability(req, res, next) {
  try {
    const { id } = req.params;
    const isAvailable = await sessionService.checkAvailability(id);
    res.status(200).json({ available: isAvailable });
  } catch (error) {
    next(error);
  }
}

async function deleteSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await sessionService.deleteSession(id);
    res.status(200).json({
      message: 'Session deleted successfully',
      session
    });
  } catch (error) {
    next(error);
  }
}

async function checkAndUpdateSessions(req, res, next) {
  try {
    await sessionService.checkAndUpdateSessions();
    res.status(200).json({ message: 'Sessions updated successfully' });
  } catch (error) {
    next(error);
  }
}

async function applyUnavaliabilityToSeats(req, res, next) {
  try {
    const { id } = req.params;
    const { seats } = req.body;
    await sessionService.applyUnavaliabilityToSeats(id, seats);
    res.status(200).json({ message: 'Unavaliability applied to seats successfully' });
  } catch (error) {
    next(error);
  }
}

async function getSessionsReport(req, res, next) {
  try {
    const { id } = req.params;
    const sessionsReport = await sessionService.generateSessionReport(id);
    res.status(200).json(sessionsReport);
  } catch (error) {
    next(error);
  }
}

module.exports = sessionsController;