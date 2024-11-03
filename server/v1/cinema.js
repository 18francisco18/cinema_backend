const bodyParser = require("body-parser");
const express = require("express");
const cinemaController = require("../../data/cinema/controller");

function CinemaRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.post("/create", cinemaController.createCinema);
  router.get("/all", cinemaController.findAllCinemas);
  router.get("/:id/find", cinemaController.findCinemaById);
  router.put("/:id/update", cinemaController.updateCinemaById);
  router.get("/:id/findCinemaRooms", cinemaController.findCinemaRoomsById);
  router.delete(
    "/removeRoom/:id/:roomId",
    cinemaController.removeCinemaRoomById
  );
  router.delete("/remove/:id", cinemaController.removeCinemaById);
  router.get("/:id/allMovies", cinemaController.getAllCinemaMovies);
  router.delete("/:id/removeMovie/:movieId", cinemaController.removeMovieFromCinema);
  router.post(
    "/:id/addMoviesToBillboard",
    cinemaController.addMoviesToBillboard
  );
  router.post("/addMoviesToAllBillboards", cinemaController.addMoviesToBillboards);

  return router;
}

module.exports = CinemaRouter;
