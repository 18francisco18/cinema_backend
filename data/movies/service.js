const axios = require("axios");
const { MOVIE_API_BASE_URL, MOVIE_API_KEY } = require("../../api");

function MovieService(movieModel) {
  let service = {
    create,
    getMovieByTitleAndYear,
  };

  function create(movie) {
    let newMovie = new movieModel(movie);
    return newMovie.save();
  }

  async function getMovieByTitleAndYear(title, year) {
    console.log("chamei a fnçao getMovieByTitleAndYear");

    try {
      const response = await axios.get(`${MOVIE_API_BASE_URL}`, {
        params: {
          t: title, // Título do filme
          y: year, // Ano do filme (opcional)
          apikey: MOVIE_API_KEY, // Chave da API
        },
      });

      // Verifica se a API retornou com sucesso
      if (response.data.Response === "False") {
        throw new Error(response.data.Error);
      }

      // Retorna os dados do filme
      const movieData = response.data;
      await movieModel.create(movieData);

      return movieData;
    } catch (error) {
      throw new Error(`Erro ao buscar o filme: ${error.message}`);
    }
  }

  return service;
}

module.exports = MovieService;
