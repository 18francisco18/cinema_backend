const bodyParser = require("body-parser");
const express = require("express");
const ticketsController = require("../../data/tickets/controller");

function TicketsRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.post("/verify-qrcode", ticketsController.verifyTicketQRCode);

  return router;
}

module.exports = TicketsRouter;
