const axios = require("axios");
const mongoose = require("mongoose");
const { MOVIE_API_BASE_URL, MOVIE_API_KEY } = require("../../api");

function MovieService(movieModel) {
  let service = {
    create,
    getMovieByTitleYearAndPlot,
    findById,
    findAll,
    removeById,
  };

  async function create(movie) {
    try {
      let newMovie = new movieModel(movie);
      let savedMovie = await newMovie.save();
      return savedMovie;
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao criar o filme: ${error.message}`);
    }
  }

  // Função para buscar um filme pelo título e ano na API OMDb
  async function getMovieByTitleYearAndPlot(title, year, plot) {
    try {
      // Busca o filme na API OMDb através do título e ano, cujos titulos e anos são passados
      //como parametros no pedido à API, pois a API OMDb permite pesquisar filmes por título e ano.
      //O pedido é feito com o método GET para a URL base da API OMDb (MOVIE_API_BASE_URL) e os parâmetros t e y.
      //É necessário passar a chave da API (MOVIE_API_KEY) como parâmetro apikey.
      const response = await axios.get(`${MOVIE_API_BASE_URL}`, {
        params: {
          t: title, // Título do filme
          y: year, // Ano do filme (opcional)
          //plot ter valores: short, full
          plot: plot, // Tipo de plot
          apikey: MOVIE_API_KEY, // Chave da API
        },
      });

      // Verifica se a API retornou com sucesso, caso contrário, lança um erro
      if (response.data.Response === "False") {
        console.log("erro");
        throw new Error(response.data.Error);
      }

      // Retorna os dados do filme
      const movieData = response.data;

      // O objetivo deste código é transformar o array de avaliações (Ratings) retornado pela API OMDb para garantir que cada 
      //objeto de avaliação tenha os campos source e value preenchidos, 
      //mesmo que a API não os forneça.
      //Primeiro acede-se ao array de avaliações com movieData.Ratings (seguido de OU [] para caso seja null ou undefined).
      //Depois, mapeia-se o array de avaliações, transformando cada objeto de avaliação (rating) 
      //em um objeto com os campos source e value preenchidos.
      const transformedRatings = (movieData.Ratings || []).map((rating) => ({
        source: rating.Source || "N/A",
        value: rating.Value || "N/A",
      }));

      // Colocar valores default para os campos que podem vir vazios
      const completeMovieData = {
        title: movieData.Title || "N/A",
        year: movieData.Year || "N/A",
        rated: movieData.Rated || "N/A",
        released: movieData.Released || "N/A",
        runtime: movieData.Runtime || "N/A",
        genre: movieData.Genre || "N/A",
        director: movieData.Director || "N/A",
        writer: movieData.Writer || "N/A",
        actors: movieData.Actors || "N/A",
        plot: movieData.Plot || "N/A",
        language: movieData.Language || "N/A",
        country: movieData.Country || "N/A",
        awards: movieData.Awards || "N/A",
        poster: movieData.Poster || "N/A",
        ratings: transformedRatings,
        metascore: movieData.Metascore || "N/A",
        imdbRating: movieData.imdbRating || "N/A",
        imdbVotes: movieData.imdbVotes || "N/A",
        imdbID: movieData.imdbID || "N/A",
        type: movieData.Type || "N/A",
        dvd: movieData.DVD || "N/A",
        boxOffice: movieData.BoxOffice || "N/A",
        production: movieData.Production || "N/A",
        website: movieData.Website || "N/A",
        response: movieData.Response || "N/A",
      };

      // Retorna os dados completos do filme
      return completeMovieData;
    } catch (error) {
      console.log(error)
      throw new Error(`Erro ao buscar o filme: ${error.message}`);
    }
  }

  // Função para buscar um filme pelo ID no banco de dados
  async function findById(id) {
    try {
      const movie = await movieModel.findById(id);
      if (!movie) {
        throw new Error("Filme não encontrado");
      }
      return movie;
    } catch (err) {
      throw new Error("Erro ao buscar o filme");
    }
  }

  // Função para buscar todos os filmes no banco de dados
  async function findAll(page, limit) {
    try {
      const movies = await movieModel.find()
        .skip((page - 1) * limit)
        .limit(limit);
        const totalMovies = await movieModel.countDocuments();
      return {
        movies,
        totalPages: Math.ceil(totalMovies / limit),
        currentPage: page,
        totalMovies,
      };
    } catch (err) {
      throw new Error("Erro ao buscar os filmes");
    }
  }

  // Função para remover um filme pelo ID no banco de dados
  async function removeById(id) {
    try {
      const movie = await movieModel.findByIdAndDelete(id);
      if (!movie) {
        throw new Error("Filme não encontrado");
      }
      return movie;
    } catch (err) {
      console.log(err);
      throw new Error("Erro ao remover o filme");
    }
  }

  return service;
}

module.exports = MovieService
