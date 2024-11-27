const bodyParser = require("body-parser");
const express = require("express");
const sessionsController = require("../../data/sessions/controller");

function SessionsRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.get("/", sessionsController.getSessions);
  router.get("/movie/:movieId", sessionsController.getSessionsByMovie);
  router.get("/:id", sessionsController.getSessionById);
  router.get("/:id/report", sessionsController.getSessionsReport);

  router.put("/:id/cancelSession", sessionsController.cancelSession);
  router.put("/:id/applyUnavailability", sessionsController.applyUnavaliabilityToSeats);

  router.post("/create", sessionsController.createSession);
  router.post("/checkAvailability", sessionsController.checkAvailability);
  
  router.delete("/:id", sessionsController.deleteSession);
  
  
  return router;
}

module.exports = SessionsRouter;
