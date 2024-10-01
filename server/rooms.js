const bodyParser = require("body-parser");
const express = require("express");
const roomsController = require("../data/rooms/controller");

function RoomsRouter() {
    let router = express();
    
    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
    
    router.post("/create", roomsController.createRoom);
    
    return router;
}

module.exports = RoomsRouter;