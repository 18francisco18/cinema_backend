const sessionService = require('../sessions');

const sessionsController = {
    createSession,
    cancelSession,
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



module.exports = sessionsController;