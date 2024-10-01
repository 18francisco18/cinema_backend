const bodyParser = require("body-parser");
const express = require("express");
const movieController = require("../data/movies/controller");

function MoviesRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.post("/search", movieController.searchMovie);

  return router;
}

module.exports = MoviesRouter;
