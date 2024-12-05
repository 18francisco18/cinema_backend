const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Room = require("../rooms/rooms");
const Movie = require("../movies/movies");
const Session = require("../sessions/sessions");
const Cinema = require("./cinema");
const movieService = require("../movies");
const roomModel = require("../rooms");
const AppError = require('../../AppError');
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, DatabaseError, ServiceUnavailableError } = require('../../AppError');

function cinemaService(cinemaModel) {
  let service = {
    create,
    save,
    findAll,
    findById,
    findByIdAndUpdate,
    removeCinemaById,
    findRoomsById,
    removeRoom,
    addMovieToBillboard,
    addMoviesToBillboards,
    removeMovie,
    removeMovies,
    getAllCinemaMovies,
    getAllCinemaBillboards,
  };

  // Cria um novo cinema
  async function create(cinema) {
    try {
      let newCinema = new cinemaModel(cinema);

      return await save(newCinema);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Salva um modelo
  function save(model) {
    return new Promise(function (resolve, reject) {
      model
        .save()
        .then(() => resolve(model))
        .catch((err) => reject(`Houve um problema ao criar o cinema ${err}`));
    });
  }

  // Encontra todos os cinemas com paginação e filtros
  async function findAll(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const cinemas = await cinemaModel.find().limit(limit).skip(skip);
      const total = await cinemaModel.countDocuments();

      if (cinemas.length === 0) {
        throw new NotFoundError("No cinemas found");
      }

      if (page > Math.ceil(total / limit)) {
        throw new NotFoundError("Page not found");
      }

      return {
        cinemas,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Encontra um cinema pelo id
  async function findById(id) {
    try {
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }

      return cinema;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Atualiza um cinema pelo id
  async function findByIdAndUpdate(id, cinema) {
    try {
      const updatedCinema = await cinemaModel.findByIdAndUpdate(id, cinema, {
        new: true,
      });
      if (!updatedCinema) {
        throw new NotFoundError("Cinema not found");
      }
      return updatedCinema;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // Encontra as salas de um cinema pelo id com paginação e filtros
  async function findRoomsById(id, page = 1, limit = 10, query = {}) {
    try {
      // Calcular o número de documentos a serem ignorados
      const skip = (page - 1) * limit;

      // Adicionar o filtro para o cinema específico
      query.cinema = id;

      // Encontrar o cinema pelo id e popular as salas com filtros e paginação
      const cinema = await cinemaModel.findById(id).populate({
        path: "rooms",
        match: query, // Aplicar os filtros
        options: {
          skip: skip,
          limit: limit,
        },
      });

      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }

      // Contar o total de salas do cinema com os filtros aplicados
      const totalRooms = await Room.countDocuments(query);

      return {
        rooms: cinema.rooms,
        total: totalRooms,
        page: page,
        pages: Math.ceil(totalRooms / limit),
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Remove uma sala de um cinema
  async function removeRoom(id, roomId) {
    try {
      const cinema = await cinemaModel.findByIdAndUpdate(
        id,
        { $pull: { rooms: roomId } },
        { new: true }
      );
      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }
      if (!cinema.rooms.includes(roomId)) {
        throw new NotFoundError("Cinema room not found");
      }

      return cinema;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Remove um cinema pelo id, removendo tambeḿ todas as salas associadas a ele.
  async function removeCinemaById(id) {
    try {
      // Utilizado functionName para identificar a função que está a ser chamada, de forma
      // a poder identificar a função no .pre utilizado no modelo de cinema devido a necessidade
      // de futuramente utilizar mais findByIdAndDelete, evitando conflitos.
      const cinema = await cinemaModel.findByIdAndDelete(id, {
        functionName: "removeCinemaById",
      });
      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }
      return cinema;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Adiciona múltiplos filmes ao cartaz de um cinema (usando POST)
  async function addMovieToBillboard(cinemaId, movies, movieId) {
    try {
      console.log("Searching Movie");
      const cinema = await Cinema.findById(cinemaId);
      console.log("Cinema: ", cinemaId);

      if (!cinema) {
        throw new Error("Cinema not found");
      }

      // Busca o filme diretamente pelo ID
      const movie = await Movie.findById(movieId);
      if (!movie) {
        throw new Error(`Movie with ID ${movieId} not found`);
      }

      // Verifica se o filme já está no billboard
      if (!cinema.movies.includes(movie._id)) {
        cinema.movies.push(movie._id);
        await cinema.save();
      }

      console.log("Updated cinema movies:", cinema.movies);
      return cinema.movies;

    } catch (err) {
      if (err.message === "Cinema not found" || err.message.startsWith("Movie with ID")) {
        throw err;
      }
      console.log(err);
      throw new Error("Erro ao adicionar filmes ao cinema");
    }
  }

  // Adiciona múltiplos filmes ao cartaz de todos os cinemas (usando POST)
  async function addMoviesToBillboards(movies) {
    try {
      // Array para armazenar os filmes a serem adicionados
      const moviesToAdd = [];

      // Para cada filme a ser adicionado
      for (let i = 0; i < movies.length; i++) {
        const title = movies[i].title;
        const year = movies[i].year;
        const plot = movies[i].plot;

        let movie = await Movie.findOne({ title: title });

        if (!movie) {
          // Busca os detalhes do filme pela API OMDb usando título e ano
          const movieDetails = await movieService.getMovieByTitleYearAndPlot(title, year, plot);

          if (!movieDetails) {
            throw new NotFoundError("Movie not found");
          }

          movie = new Movie({
            title: movieDetails.title,
            year: movieDetails.year,
            rated: movieDetails.rated,
            released: movieDetails.released,
            runtime: movieDetails.runtime,
            genre: movieDetails.genre,
            director: movieDetails.director,
            writer: movieDetails.writer,
            actors: movieDetails.actors,
            plot: movieDetails.plot,
            language: movieDetails.language,
            country: movieDetails.country,
            awards: movieDetails.awards,
            poster: movieDetails.poster,
            ratings: movieDetails.ratings,
            metascore: movieDetails.metascore,
            imdbRating: movieDetails.imdbRating,
            imdbVotes: movieDetails.imdbVotes,
            imdbID: movieDetails.imdbID,
            type: movieDetails.type,
            dvd: movieDetails.dvd,
            boxOffice: movieDetails.boxOffice,
            production: movieDetails.production,
            website: movieDetails.website,
            response: movieDetails.response,
          });

          await movie.save();
        }

        // Adiciona o filme ao array de filmes a serem adicionados
        moviesToAdd.push(movie._id);
      }

      // Adiciona os filmes ao cartaz de todos os cinemas
      const cinemas = await cinemaModel.find();
      for (let i = 0; i < cinemas.length; i++) {
        cinemas[i].movies.push(...moviesToAdd);
        await cinemas[i].save();
      }

      return moviesToAdd;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  //Remover um filme do cartaz de um cinema
  async function removeMovie(id, movieId) {
    try {
      // Encontra o cinema pelo id
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }

      // Verifica se o filme existe no cartaz do cinema
      if (!cinema.movies.includes(movieId)) {
        throw new NotFoundError("Movie not found in cinema");
      }

      // Remove o filme do cartaz do cinema
      cinema.movies.pull(movieId);
      await cinema.save();
      console.log("Updated cinema movies:", cinema.movies);

      return cinema;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Remover filmes de todos os cinemas
  async function removeMovies(movies) {
    try {
      // Para cada filme a ser removido
      for (let i = 0; i < movies.length; i++) {
        // Encontra o filme pelo id
        const movie = await Movie.findById(movies[i]);
        if (!movie) {
          throw new NotFoundError("Movie not found");
        }

        // Remove o filme de todos os cartazes de todos os cinemas
        const cinemas = await cinemaModel.find();
        for (let j = 0; j < cinemas.length; j++) {
          if (cinemas[j].movies.includes(movies[i])) {
            cinemas[j].movies.pull(movies[i]);
            await cinemas[j].save();
          }
        }
      }

      return movies;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Busca todos os filmes de um cinema com paginação, filtragem e ordenação
  async function getAllCinemaMovies(
    id,
    page = 1,
    limit = 10,
    query = {},
    sort = {}
  ) {
    try {
      const skip = (page - 1) * limit;

      // Encontrar o cinema pelo id e popular os filmes
      const cinema = await cinemaModel.findById(id).populate({
        path: "movies",
        options: {
          skip: skip,
          limit: limit,
          sort: sort
        }
      });

      console.log("Cinema: ", cinema);

      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }

      // Aplicar filtros manualmente nos filmes populados
      let filteredMovies = cinema.movies;
      
      if (query.title) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.title.toLowerCase().includes(query.title.toLowerCase())
        );
      }
      if (query.genre) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.genre.toLowerCase().includes(query.genre.toLowerCase())
        );
      }
      if (query.year) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.year === query.year
        );
      }
      if (query.rated) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.rated.toLowerCase() === query.rated.toLowerCase()
        );
      }
      if (query.director) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.director.toLowerCase().includes(query.director.toLowerCase())
        );
      }
      if (query.actors) {
        filteredMovies = filteredMovies.filter(movie => 
          movie.actors.some(actor => 
            query.actors.includes(actor)
          )
        );
      }

      return {
        movies: filteredMovies,
        total: filteredMovies.length,
        page: page,
        pages: Math.ceil(filteredMovies.length / limit)
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getAllCinemaBillboards(
    page = 1,
    limit = 10,
    filters = {},
    sort = {}
  ) {
    try {
      const skip = (page - 1) * limit;

      const cinemas = await cinemaModel.find().skip(skip).limit(limit);
      if (cinemas.length === 0) {
        throw new NotFoundError("No cinemas found");
      }

      const billboards = [];
      for (let i = 0; i < cinemas.length; i++) {
        const cinema = cinemas[i];
        const movies = await Movie.find({
          _id: { $in: cinema.movies, ...filters },
        }).sort(sort);
        billboards.push({ cinema: cinema.name, movies: movies });
      }

      const totalCinemas = await cinemaModel.countDocuments();
      const totalPages = Math.ceil(totalCinemas / limit);

      return {
        billboards,
        totalCinemas,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

 
  

  return service;
}

module.exports = cinemaService;