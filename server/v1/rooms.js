const bodyParser = require("body-parser");
const express = require("express");
const roomsController = require("../../data/rooms/controller");

function RoomsRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.get("/find/:id", roomsController.getRoomById);
  router.get("/findAll", roomsController.getAllRooms);

  router.put("/update/:id", roomsController.updateRoomById);
  router.put("/:id/updateSeatStatus", roomsController.updateSeatStatus);

  router.post("/create", roomsController.createRoom);

  router.delete("/remove/:id", roomsController.removeRoomById);

  

  return router;
}

module.exports = RoomsRouter;
