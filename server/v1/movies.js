const bodyParser = require("body-parser");
const express = require("express");
const movieController = require("../../data/movies/controller");
const verifyToken = require("../../middleware/token");
const verifyAdmin = require("../../middleware/admin");

function MoviesRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Rotas de filmes
  router.get("/", movieController.getAllMovies);
  router.get("/findById/:id", movieController.getMovieById);
  router.post("/search", movieController.searchMovie);
  router.delete("/remove/:id", movieController.removeMovie);

  // Rotas de comentários (protegidas por autenticação)
  router.post("/:movieId/comments", verifyToken, movieController.createComment);
  router.get("/:movieId/comments", movieController.getComments);
  router.put("/:movieId/comments/:commentId", verifyToken, movieController.updateComment);
  router.delete("/:movieId/comments/:commentId", verifyToken, movieController.deleteComment);
  
  // Rota administrativa para deletar todos os comentários
  router.delete("/comments/deleteAll", verifyToken, verifyAdmin, movieController.deleteAllComments);
  router.get("/comments/all", verifyToken, verifyAdmin, movieController.getAllComments);

  return router;
}

module.exports = MoviesRouter;
