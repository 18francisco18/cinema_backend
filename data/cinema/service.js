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
      throw (error);
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

  // Encontra todos os cinemas
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
        throw new NotFoundError("Cinema not found")
      }

      return cinema;
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  // Atualiza um cinema pelo id
  async function findByIdAndUpdate(id, cinema) {
    try {
      const updatedCinema = await cinemaModel.findByIdAndUpdate(id, cinema, { new: true });
      if (!updatedCinema) {
        throw new NotFoundError("Cinema not found")
      }
      return updatedCinema;
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  // Encontra as salas de um cinema pelo id com paginação
  async function findRoomsById(id, page = 1, limit = 10) {
    try {
      // Calcular o número de documentos a serem ignorados
      const skip = (page - 1) * limit;

      // Encontrar o cinema pelo id e popular as salas
      const cinema = await cinemaModel.findById(id).populate({
        path: "rooms",
        options: {
          skip: skip,
          limit: limit,
        },
      });

      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }

      // Contar o total de salas do cinema
      const totalRooms = await Room.countDocuments({ cinema: id });

      return {
        rooms: cinema.rooms,
        total: totalRooms,
        page: page,
        pages: Math.ceil(totalRooms / limit),
      };
    } catch (err) {
      console.log(err)
      throw err
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
  async function addMovieToBillboard(id, movies) {
    console.log("Searching Movie");
    try {
      // Encontra o cinema pelo id
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }

      console.log("movies", movies);

      // Array para armazenar os filmes a serem adicionados
      const moviesToAdd = [];

      // Para cada filme a ser adicionado
      const title = movies.title;
      const year = movies.year;
      const plot = movies.plot;

      // Busca os detalhes do filme pela API OMDb usando título e ano
      const movieDetails = await movieService.getMovieByTitleYearAndPlot(
        title,
        year,
        plot
      );

      if (!movieDetails) {
        throw new NotFoundError("Movie not found");
      }

      console.log("teste", movieDetails);

      // Verifica se o filme já existe no banco de dados
      let movie = await Movie.findOne({ imdbID: movieDetails.imdbID });

      // Se o filme não existir, cria um novo
      if (!movie) {
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

      if (!cinema.movies.includes(movie._id)) {
        moviesToAdd.push(movie._id);
      }

      // Adiciona os filmes ao cartaz do cinema
      cinema.movies.push(...moviesToAdd);
      await cinema.save();
      console.log("Updated cinema movies:", cinema.movies);

      return cinema.movies;
    } catch (err) {
      console.log(err);
      throw err;
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

        // Busca os detalhes do filme pela API OMDb usando título e ano
        const movieDetails = await movieService.getMovieByTitleYearAndPlot(
          title,
          year,
          plot
        );

        if (!movieDetails) {
          throw new NotFoundError("Movie not found");
        }

        // Verifica se o filme já existe no banco de dados
        let movie = await Movie.findOne({ imdbID: movieDetails.imdbID });

        if (movie) {
          throw new ConflictError(`Movie with ID ${movieDetails.imdbID} already exists`);
        }

        // Se o filme não existir, cria um novo
        if (!movie) {
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

  // Busca todos os filmes de um cinema
  async function getAllCinemaMovies(id) {
    try {
      const cinema = await cinemaModel.findById(id).populate("movies");
      if (!cinema) {
        throw new NotFoundError("Cinema not found");
      }

      if (cinema.movies.length === 0) {
        throw new NotFoundError("No movies found in cinema");
      }

      return cinema.movies;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getAllCinemaBillboards() {
    try {
      const cinemas = await cinemaModel.find().populate("movies");
      if (!cinemas || cinemas.length === 0) {
        throw new NotFoundError("No cinemas found");
      }

      let allMovies = [];
      cinemas.forEach(cinema => {
        if (cinema.movies && cinema.movies.length > 0) {
          allMovies = allMovies.concat(cinema.movies);
        }
      });

      if (allMovies.length === 0) {
        throw new NotFoundError("No movies found in any cinema");
      }

      return allMovies;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  return service;
}

module.exports = cinemaService;