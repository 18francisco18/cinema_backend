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
async function createSession(req, res) {
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
    console.error(error.message);

    // Lidar com erros (por exemplo, sala não encontrada ou falha ao criar a sessão)
    if (error.message === 'Room not found') {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    if (error.message === 'Movie not found') {
      return res.status(404).json({ error: 'Filme não encontrado' });
    }

    res.status(500).json({ error: 'Erro ao criar a sessão' });
  }
}

async function cancelSession(req, res) {
  try {
    const { id } = req.params;

    // Chamar o serviço para cancelar a sessão com o ID fornecido
    await sessionService.cancelSession(id);

    // Se a sessão foi cancelada com sucesso, retornar uma mensagem de sucesso
    res.status(200).json({ message: 'Sessão cancelada com sucesso' });
  } catch (error) {
    console.error(error.message);

    // Lidar com erros (por exemplo, sessão não encontrada ou falha ao cancelar a sessão)
    if (error.message === 'Session not found') {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (error.message === "Cannot cancel the session less than 1 hour before the start time.") {
      return res
        .status(400)
        .json({
          error:
            "Cannot cancel the session less than 1 hour before the start time.",
        });
    }

    if (error.message === 'Session already cancelled') {
      return res.status(400).json({ error: "Session already cancelled" });
    }

    if (error.message === 'Session already finished') {
      return res.status(400).json({ error: 'Session already finished' });
    }

    res.status(500).json({ error: 'Error cancelling the session' });
  }
}

async function getSessions(req, res) {
  try {
    const sessions = await sessionService.findAll();

    res.status(200).json(sessions);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error getting sessions' });
  }
}

async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await sessionService.findById(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error getting session' });
  }
}

async function deleteSession(req, res) {
  try {
    const { id } = req.params;

    const session = await sessionService.deleteSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      message: 'Session deleted successfully',
      session
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error deleting session' });
  }
}

async function checkAvailability(req, res) {
  try {
    const { id } = req.params;

    const isAvailable = await sessionService.checkAvailability(id);

    res.status(200).json({ available: isAvailable });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error checking availability' });
  }
}

async function deleteSession(req, res) {
  try {
    const { id } = req.params;

    const session = await sessionService.deleteSession(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.status(200).json({
      message: 'Session deleted successfully',
      session
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error deleting session' });
  }
}

async function checkAndUpdateSessions(req, res) {
  try {
    await sessionService.checkAndUpdateSessions();

    res.status(200).json({ message: 'Sessions updated successfully' });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error updating sessions' });
  }
}

async function applyUnavaliabilityToSeats(req, res) {
  try {
    const { id } = req.params;

    const { seats } = req.body;

    await sessionService.applyUnavaliabilityToSeats(id, seats);

    res.status(200).json({ message: 'Unavaliability applied to seats successfully' });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error applying unavaliability to seats' });
  }
}

async function getSessionsReport(req, res) {
  try {
    const { id } = req.params;

    const sessionsReport = await sessionService.generateSessionReport(id);

    res.status(200).json(sessionsReport);
  } catch (error) {
    console.error(error.message);

    res.status(500).json({ error: 'Error getting sessions report' });
  }
}

module.exports = sessionsController;