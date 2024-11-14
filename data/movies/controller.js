const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
} = require("../../AppError");
const movieService = require("../movies"); // O serviço que lida com a requisição à OMDb API
const movieModel = require("./movies"); // O modelo de filme

const movieController = {
  searchMovie,
  getMovieById,
  getAllMovies,
  removeMovie,
};

// Controlador para lidar com a busca de filmes
async function searchMovie(req, res, next) {
  try {
    const { title, year, plot } = req.body; // Extrai o título e o ano da requisição
    const movie = await movieService.searchMovie(title, year, plot); // Chama o serviço que faz a requisição à OMDb API
    res.status(200).send(movie); // Retorna o filme recém-salvo
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para obter um filme pelo ID
async function getMovieById(req, res, next) {
  try {
    const { id } = req.params;
    const movie = await movieService.findById(id);
    res.status(200).send(movie);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

// Controlador para obter todos os filmes
async function getAllMovies(req, res, next) {
  try {
    const movies = await movieService.findAll();
    res.status(200).send(movies);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

async function removeMovie(req, res, next) {
  try {
    const { id } = req.params;
    const movie = await movieService.removeById(id);
    res.status(200).send(movie);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

module.exports = movieController;
