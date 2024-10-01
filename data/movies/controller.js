const movieService = require("../movies"); // O serviço que lida com a requisição à OMDb API
const movieModel = require("./movies"); // O modelo de filme

const movieController = {
  searchMovie,
};

// Controlador para lidar com a busca de filmes
async function searchMovie(req, res) {
  const { title, year } = req.body; // Extrai o título e o ano da requisição

  if (!title) {
    return res.status(400).send({ error: "O título do filme é obrigatório" });
  }

  try {
    // Chama o serviço que faz a requisição à OMDb API
    const movie = await movieService.getMovieByTitleAndYear(title, year);


    // Verifica se o filme já está no banco de dados
    const existingMovie = await movieModel.findOne({ imdbID: movie.imdbID });
    if (existingMovie) {
      return res.status(200).send(existingMovie); // Se o filme já existe, retorna-o
    }

    // Se não existir, salva no banco de dados
    const newMovie = await movieModel.create(movie);

    res.status(201).send(newMovie); // Retorna o filme recém-salvo
  } catch (error) {
    res.status(400).send({ error: error.message }); // Em caso de erro, retorna a mensagem
  }
}

module.exports = movieController;
