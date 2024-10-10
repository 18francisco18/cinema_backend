const bodyParser = require('body-parser');
const express = require('express');
const sessionsController = require('../data/sessions/controller');

function SessionsRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: '100mb' }));
    router.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

    router.post('/create', sessionsController.createSession);
    router.put('/:id/cancelSession', sessionsController.cancelSession);
    router.get('/', sessionsController.getSessions);
    router.get('/:id', sessionsController.getSessionById);
    router.delete('/:id', sessionsController.deleteSession);
    router.post('/checkAvailability', sessionsController.checkAvailability);
    router.put('/:id/applyUnavailability', sessionsController.applyUnavaliabilityToSeats);

    return router;
}

module.exports = SessionsRouter;