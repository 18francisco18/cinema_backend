const sessionsService = require('../sessions');

const sessionsController = {
    createSession,

}

async function createSession(req, res) {
    try {
        const session = req.body;
        const newSession = await sessionsService.create(session);
        res.status(201).send(newSession);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = sessionsController;