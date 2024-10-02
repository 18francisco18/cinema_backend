const Session = require('./sessions');
const SessionsService = require('./service');

const sessionService = SessionsService(Session);
module.exports = sessionService;