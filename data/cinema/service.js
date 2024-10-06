const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Room = require("../rooms/rooms");
const Movie = require("../movies/movies");
const Session = require("../sessions/sessions");
const Cinema = require("./cinema");

function cinemaService(cinemaModel) {
  let service = {
    create,
    save,
    findAll,
    findById,
    findByIdAndUpdate,
    removeCinemaById,
    findRoomsById,
    //fillRoom,
    removeRoom,
    occupyRoom,
    addMovie,
    removeMovie,
    addMoviesToBillboard,
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

  /*
  async function fillRoom(id, room, movie) {
    try {
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new Error("Cinema not found");
      }

      // Encontra a sala pelo id
      const roomIndex = cinema.rooms.findIndex((r) => r._id == room);
      if (roomIndex === -1) {
        throw new Error("Room not found");
      }

      // Verifica se a sala já está ocupada
      if (cinema.rooms[roomIndex].occupied) {
        throw new Error("Room already occupied");
      }

      // Encontra o filme pelo id
      const movieFound = await Movie.findById(movie);
      if (!movieFound) {
        throw new Error("Movie not found");
      }

      // Encontra a sessão pelo id
      const session = await Session.findById(movie);
      if (!session) {
        throw new Error("Session not found");
      }

      // Preenche a sala com o filme
      cinema.rooms[roomIndex].movie = movie;
      return await save(cinema);
    }
    catch (err) {
      if (err.message === "Cinema not found" || err.message === "Room not found" || err.message === "Room already occupied" || err.message === "Movie not found" || err.message === "Session not found") {
        throw err;
      }
      throw new Error("Erro ao preencher sala");
    }
    
  }
  */

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
      const cinema = await cinemaModel.findByIdAndDelete(id, { functionName: "removeCinemaById" });
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      return cinema;
    } catch (err) {
      throw new Error("Erro ao remover cinema");
    }
  }

  async function occupyRoom(id, room, session) {
    try {
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new Error("Cinema not found");
      }
      
      // Encontra a sala pelo id
      const roomIndex = cinema.rooms.findIndex((r) => r._id == room);
      if (roomIndex === -1) {
        throw new Error("Room not found");
      }

      // Verifica se a sala já está ocupada
      if (cinema.rooms[roomIndex].occupied) {
        throw new Error("Room already occupied");
      }

      // Ocupa a sala
      cinema.rooms[roomIndex].occupied = true;
      cinema.sessions.push(session);

      return await save(cinema);
    }
    catch (err) {
      if (err.message === "Cinema not found" || err.message === "Room not found" || err.message === "Room already occupied") {
        throw err;
      }
      throw new Error("Erro ao ocupar sala");
    }
  }

  async function addMovie(id, movie) {
    try {
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new Error("Cinema not found");
      }

      const movieFound = await Movie.findById(movie);
      if (!movieFound) {
        throw new Error("Movie not found");
      }

      cinema.movies.push(movieFound);
      return await save(cinema);
    }
    catch (err) {
      if (err.message === "Cinema not found" || err.message === "Movie not found") {
        throw err;
      }
      throw new Error("Erro ao adicionar filme ao cinema");
    }
  }

  // Remove um filme de um cinema
  async function removeMovie(id, movie) {
    try {

      // Encontra o cinema pelo id
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new Error("Cinema not found");
      }

      // Encontra o filme pelo id
      const movieIndex = cinema.movies.findIndex((m) => m._id == movie); //findIndex retorna o índice do elemento no array
      // Se o filme não for encontrado, retorna um erro
      if (movieIndex === -1) {
        throw new Error("Movie not found");
      }

      // Remove o filme do array de filmes do cinema
      cinema.movies.splice(movieIndex, 1);
      return await save(cinema);
    }
    catch (err) {
      if (err.message === "Cinema not found" || err.message === "Movie not found") {
        throw err;
      }
      throw new Error("Erro ao remover filme do cinema");
    }
  }

  // Adiciona filmes ao cartaz de um cinema
  async function addMoviesToBillboard(id, movies) {
    try {
      const cinema = await cinemaModel.findById(id);
      if (!cinema) {
        throw new Error("Cinema not found");
      }

      // Separa os ids dos filmes em um array
      const moviesArray = movies.split(",");
      // Cria um array para adicionar os filmes
      const moviesToAdd = [];
      // Para cada id de filme, encontra o filme pelo id e adiciona ao array
      for (let i = 0; i < moviesArray.length; i++) {
        const movie = await Movie.findById(moviesArray[i]);
        if (!movie) {
          throw new Error("Movie not found");
        }
        moviesToAdd.push(movie);
      }

      // Adiciona os filmes ao cartaz do cinema
      cinema.movies = moviesToAdd;
      return await save(cinema);
    }
    catch (err) {
      if (err.message === "Cinema not found" || err.message === "Movie not found") {
        throw err;
      }
      throw new Error("Erro ao adicionar filmes ao cinema");
    }
  }

  return service;
}

module.exports = cinemaService;
