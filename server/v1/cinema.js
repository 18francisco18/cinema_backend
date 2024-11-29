const bodyParser = require("body-parser");
const express = require("express");
const cinemaController = require("../../data/cinema/controller");

function CinemaRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));


  router.get("/all", cinemaController.findAllCinemas);
  router.get("/:id/find", cinemaController.findCinemaById);
  router.get("/:id/findCinemaRooms", cinemaController.findCinemaRoomsById);
  router.get("/:id/allMovies", cinemaController.getAllCinemaMovies);
  router.get("/allBillboards", cinemaController.getAllCinemaBillboards);

  router.put("/:id/removeMovie/:movieId", cinemaController.removeMovieFromCinema);
  router.put("/removeMovies", cinemaController.removeMovieFromBillboards);
  //router.put("/removeMovies", cinemaController.removeMovieFromBillboards);
  router.put("/:id/update", cinemaController.updateCinemaById);

  router.post("/:id/addMoviesToBillboard/:movieId", cinemaController.addMoviesToBillboard);
  router.post("/create", cinemaController.createCinema);
  router.post("/addMoviesToAllBillboards", cinemaController.addMoviesToBillboards);

  router.delete("/:id/removeRoom/:roomId", cinemaController.removeCinemaRoomById);
  router.delete("/remove/:id", cinemaController.removeCinemaById);


  return router;
}

module.exports = CinemaRouter;
