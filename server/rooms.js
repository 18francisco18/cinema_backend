const bodyParser = require("body-parser");
const express = require("express");
const roomsController = require("../data/rooms/controller");

function RoomsRouter() {
    let router = express();
    
    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
    
    router.post("/create", roomsController.createRoom);

    router.get("/find/:id", roomsController.getRoomById);

    router.get("/findAll", roomsController.getAllRooms);

    router.delete("/remove/:id", roomsController.removeRoomById);

    router.put("/update/:id", roomsController.updateRoomById);
    
    router.put("/:id/updateSeatStatus", roomsController.updateSeatStatus);
    
    return router;
}

module.exports = RoomsRouter;