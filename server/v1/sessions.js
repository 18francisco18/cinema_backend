const bodyParser = require("body-parser");
const express = require("express");
const sessionsController = require("../../data/sessions/controller");

function SessionsRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.get("/find-all", sessionsController.getSessions);
  router.get("/by-date", sessionsController.getSessionsByDate);
  router.get("/movie/:movieId", sessionsController.getSessionsByMovie);
  router.get("/getAll", sessionsController.getAllSessionReports);
  router.get("/:id", sessionsController.getSessionById);
  router.get("/:sessionId/get-session-report", sessionsController.getSessionsReport);
  router.get("/:sessionId/getReport", sessionsController.getReport);
  router.get("/:sessionId/summonSessionReport", sessionsController.summonSessionReport);
  
  router.put("/:id/cancelSession", sessionsController.cancelSession);
  router.put("/:id/applyUnavailability", sessionsController.applyUnavaliabilityToSeats);

  router.post("/create", sessionsController.generateSession);
  router.post("/checkAvailability", sessionsController.checkAvailability);

  router.post("/:sessionId/generate-report", sessionsController.getSessionsReport);
 
  
  router.delete("/:id", sessionsController.deleteSession);
  
  
  return router;
}

module.exports = SessionsRouter;
