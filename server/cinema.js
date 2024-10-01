const bodyParser = require("body-parser");
const express = require("express");
const cinemaController = require("../data/cinema/controller");

function CinemaRouter() {
    let router = express();
    
    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
    
    router.post("/create", cinemaController.createCinema);
    router.get("/all", cinemaController.findAllCinemas);
    
    return router;
}

module.exports = CinemaRouter;
