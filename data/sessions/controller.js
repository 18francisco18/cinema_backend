const sessionService = require('../sessions');

const sessionsController = {
    generateSession,
    cancelSession,
    getSessions,
    getSessionById,
    getSessionsByMovie,
    getSessionsByDate,
    deleteSession,
    checkAvailability,
    checkAndUpdateSessions,
    applyUnavaliabilityToSeats,
    getSessionsReport,
    getAllSessionReports,
    getReport
}

// Controlador para criar uma nova sessão
async function generateSession(req, res, next) {
  try {
    const { room, movie, date, price, startTime, endTime } = req.body;

    // Chamar o serviço para criar uma sessão com os dados fornecidos
    const session = await sessionService.createSession(room, movie, date, price, startTime, endTime);

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const movie = req.query.movie;
    const sessions = await sessionService.findAll(page, limit, movie);
    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
}

async function getSessionById(req, res, next) {
  try {
    const { id } = req.params;
    const session = await sessionService.findById(id);
    console.log(session);
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
    const { sessionId } = req.params;
    const report = await sessionService.generateSessionReport(sessionId);
    res.status(200).json(report);
  } catch (error) {
    console.error('Erro ao gerar relatório de sessão:', error);
    res.status(500).json({ error: 'Falha ao gerar relatório de sessão' });
  }
}

// Controlador para buscar todos os relatórios de sessão com paginação e filtros
async function getAllSessionReports(req, res, next) {
  try {
    console.log('Buscando todos os relatórios de sessão...');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;


    

    const result = await sessionService.getAllSessionReports(page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// Controlador para buscar sessões por filme
async function getSessionsByMovie(req, res, next) {
  try {
    const { movieId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const sessions = await sessionService.findByMovie(movieId, page, limit);
    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
}

// Controlador para buscar relatório de sessão
async function getReport(req, res, next){
  try {
    const { sessionId } = req.params;
    const report = await sessionService.getReportFromSession(sessionId);
    res.status(200).json(report);
  } catch (error) {
    console.error('Erro ao gerar relatório de sessão:', error);
    res.status(500).json({ error: 'Falha ao gerar relatório de sessão' });
  }
}

// Controlador para buscar sessões por data
async function getSessionsByDate(req, res, next) {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    // Converter a data para o início e fim do dia
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Buscar sessões dentro do intervalo de data
    const sessions = await sessionService.findSessionsByDateRange(startDate, endDate);

    res.status(200).json({
      sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    next(error);
  }
}

module.exports = sessionsController;