const Session = require('./sessions');
const SessionService = require('./service');

const sessionService = SessionService(Session);
module.exports = sessionService;