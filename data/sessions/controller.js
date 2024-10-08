const sessionService = require('../sessions');

const sessionsController = {
    createSession,
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

module.exports = sessionsController;