const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Room = require("../rooms/rooms");
const Movie = require("../movies/movies");
const Session = require("../sessions/sessions");
const Cinema = require("./cinema");
const movieService = require("../movies");

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
    removeMovie,
    addMovieToBillboard,
    addMovieToAllBillboards,
    getAllCinemaMovies,
  };

  // Cria um novo cinema
  async function create(cinema) {
    try {
      let newCinema = new cinemaModel(cinema);
      return await save(newCinema);
    } catch (error) {
      console.log(error);
      throw new Error(`Check for missing fields or wrong fields`);
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
  async function findAll() {
    try {
      return await cinemaModel.find({});
    } catch (error) {
      console.log(error);
      throw new Error(`Erro ao buscar cinemas: ${error.message}`);
    }
  }

  // Encontra um cinema pelo id
  async function findById(id) {
    try {
      return await cinemaModel.findById(id);
    } catch (error) {
      console.log(error);
      throw new Error(`Cinema not found`);
    }
  }

  // Atualiza um cinema pelo id
  async function findByIdAndUpdate(id, cinema) {
    try {
      return await cinemaModel.findByIdAndUpdate(id, cinema, { new: true });
    } catch (error) {
      console.log(error);
      throw new Error(`Cinema not found`);
    }
  }

  // Encontra as salas de um cinema pelo id
  async function findRoomsById(id) {
    try {
      // Encontrar o cinema pelo id e popular as salas (populate serve para buscar toda a informação
      //da sala através do seu id)
      const cinema = await cinemaModel.findById(id).populate("rooms");
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      return cinema.Rooms;
    } catch (err) {
      if (err.message === "Cinema not found") {
        throw err;
      }

      throw new Error("Erro ao buscar salas do cinema");
    }
  }

  // Remove uma sala de um cinema
  async function removeRoom(id, room) {
    try {
      const cinema = await cinemaModel.findByIdAndUpdate(
        id,
        { $pull: { rooms: room } },
        { new: true }
      );
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      return cinema;
    } catch (err) {
      if (err.message === "Cinema not found") {
        throw err;
      }
      throw new Error("Erro ao remover sala do cinema");
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
        throw new Error("Cinema not found");
      }
      return cinema;
    } catch (err) {
      throw new Error("Erro ao remover cinema");
    }
  }

  // Remove um filme de um cinema
  async function removeMovie(id, movie) {
    try {
      // Encontra o cinema pelo id e remove o filme
      const cinema = await cinemaModel.findByIdAndUpdate(
        //id do cinema
        id,
        //remove o filme
        { $pull: { movies: movie } },
        //retorna o cinema atualizado
        { new: true }
      );
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      return cinema;
    }
    catch (err) {
      if (err.message === "Cinema not found") {
        throw err;
      }
      throw new Error("Erro ao remover filme do cinema");
    }
  }

  // Adiciona múltiplos filmes ao cartaz de um cinema (usando POST)
  async function addMovieToBillboard(id, movies) {
    console.log("Searching Movie");
    try {
      // Encontra o cinema pelo id
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new Error("Cinema not found");
      }

      console.log("movies", movies);

      // Array para armazenar os filmes a serem adicionados
      const moviesToAdd = [];
  
      // Para cada filme a ser adicionado
      const title = movies.title;
      const year = movies.year;
      const plot = movies.plot;

      // Busca os detalhes do filme pela API OMDb usando título e ano
      const movieDetails = await movieService.getMovieByTitleYearAndPlot(title, year, plot);

      if (!movieDetails) {
        throw new Error("Movie not found");
      }
      
      console.log("teste",movieDetails);

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
      if (err.message === "Cinema not found" || err.message.startsWith("Movie with ID")) {
        throw err;
      }
      console.log(err);
      throw new Error("Erro ao adicionar filmes ao cinema");
    }
  }

  // Adiciona múltiplos filmes ao cartaz de todos os cinemas (Usando POST)
  async function addMovieToAllBillboards(movies) {
    console.log("Searching Movie on all cinemas");
    try {
      // Encontra todos os cinemas presentes na base de dados
      const cinemas = await cinemaModel.find({});
      if (!cinemas) {
        throw new Error("Cinema not found");
      }
  
      console.log("movies", movies);
  
      // Iterar sobre o array de filmes
      for (const movieData of movies) {
        const { title, year, plot } = movieData;
  
        // Busca os detalhes do filme pela API OMDb usando título e ano
        const movieDetails = await movieService.getMovieByTitleYearAndPlot(title, year, plot);
  
        // Se o filme não for encontrado, será enviado um erro
        if (!movieDetails) {
          throw new Error("Movie not found");
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
  
        // Adiciona o filme ao cartaz de todos os cinemas
        for (const cinema of cinemas) {
          if (!cinema.movies.includes(movie._id)) {
            cinema.movies.push(movie._id);
            await cinema.save();
            console.log("Updated cinema movies:", cinema.movies);
          }
        }
      }
  
      return "Filmes adicionados com sucesso";
  
    } catch (err) {
      if (err.message === "Cinema not found" || err.message.startsWith("Movie with ID")) {
        throw err;
      }
      console.log(err);
      throw new Error("Erro ao adicionar filmes ao cinema");
    }
  }

  //Remover filmes de todos os cinemas
  async function removeMoviesFromAllCinemas(id, movies){

  }
  
  // Busca todos os filmes de um cinema
  async function getAllCinemaMovies(id) {
    try {
      const cinema = await cinemaModel.findById(id).populate("movies");
      if (!cinema) {
        console.log(err);
        throw new Error("Cinema not found");
        
      }

      return cinema.movies;
    } catch (err) {
      if (err.message === "Cinema not found") {
        console.log(err);
        throw err;
      }
      throw new Error("Erro ao buscar filmes do cinema");
    }
  }

  return service;
}

module.exports = cinemaService;
