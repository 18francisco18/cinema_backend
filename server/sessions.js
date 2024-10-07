const bodyParser = require('body-parser');
const express = require('express');
const sessionsController = require('../data/sessions/controller');

function SessionsRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: '100mb' }));
    router.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

    router.post('/create', sessionsController.createSession);

    return router;
}

module.exports = SessionsRouter;