const cinemaService = require('../cinema');

const cinemaController = {
    createCinema,
    findAllCinemas,
    findCinemaById,
    updateCinemaById,
    findCinemaRoomsById,
    removeCinemaRoomById,
    removeCinemaById,
    removeMovieFromCinema,
    addMoviesToBillboard,
    addMoviesToBillboards,
    getAllCinemaMovies,
}

// Controlador para criar um novo cinema.
async function createCinema(req, res) {
    try {
        const cinema = req.body;
        const newCinema = await cinemaService.create(cinema);
        res.status(201).send(newCinema);
    } catch (error) {
        console.log(error);
        if (error.message === "Check for missing fields or wrong fields") {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Controlador para buscar todos os cinemas.
async function findAllCinemas(req, res) {
    try {
        const cinemas = await cinemaService.findAll();
        res.status(200).send(cinemas);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

// Controlador para buscar um cinema pelo seu id.
async function findCinemaById(req, res) {
    try {
        const { id } = req.params;
        const cinema = await cinemaService.findById(id);
        res.status(200).send(cinema);
    } catch (error) {
        console.log(error);
        if (error.message === "Cinema not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Controlador para atualizar um cinema pelo seu id.
async function updateCinemaById(req, res) {
    try {
        const { id } = req.params;
        const cinema = req.body;
        const updatedCinema = await cinemaService.findByIdAndUpdate(id, cinema);
        res.status(200).send(updatedCinema);
    } catch (error) {
        console.log(error);
        if (error.message === "Cinema not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Controlador para buscar as salas de um cinema pelo seu id.
async function findCinemaRoomsById (req, res) {
    try {
        const { id } = req.params;
        const room = await cinemaService.findRoomsById(id);
        res.status(200).send(room);
    } catch (error) {
        console.log(error);
        if (error.message === "Cinema not found") {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Retira uma sala de um cinema, não elimina.
async function removeCinemaRoomById(req, res) {
    try {
        const { id, roomId } = req.params;
        const cinema = await cinemaService.removeRoom(id, roomId);
         if (!cinema) {
           res.status(404).json({ error: "Cinema not found" });
         } else {
           res.status(200).json(cinema);
           console.log("Room removed from cinema");
         }
    } catch (error) {
        if (error.message === "Cinema not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Controlador para remover um cinema e as respetivas salas associadas pelo seu id.
async function removeCinemaById(req, res) {
    try {
        const { id } = req.params;
        const cinema = await cinemaService.removeCinemaById(id);

        if (!cinema) {
            res.status(404).json({ error: "Cinema not found" });
        } else {
            res.status(204).json({ message: "Cinema and associated rooms deleted." });
            console.log("Cinema removed");
        }

    } catch (error) {
        console.log(error);
        if (error.message === "Cinema not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Controlador que remove um filme de um cinema
async function removeMovieFromCinema(req, res){
    try{
        const { id, movieId } = req.params;
        const cinema = await cinemaService.removeMovie(id, movieId);
        if (!cinema) {
            res.status(404).json({ error: "Cinema not found" });
        } else {
            res.status(200).json(cinema);
            console.log("Movie removed from cinema");
        }
    }
    catch(error){
        console.log(error);
        if (error.message === "Cinema not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Adicionar filmes a um cartaz de um cinema
async function addMoviesToBillboard(req, res) {
    try {
        const { id } = req.params;
        const { movies } = req.body;

        console.log("Cinema ID:", id);
        console.log("Movies to add:", movies);
        
        const cinema = await cinemaService.addMovieToBillboard(id, movies);
        if (!cinema) {
            res.status(404).json({ error: "Cinema not found" });
        } else {
            res.status(200).json(cinema);
            console.log("Movies added to billboard");
        }   
    } catch (error) {
        console.log(error);
        if (error.message === "Cinema not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

// Adicionar filmes a todos os cartazes de cinema
async function addMoviesToBillboards(req, res) {
    try {
      const { movies } = req.body;
      console.log("Movies to add:", movies);
      const result = await cinemaService.addMovieToAllBillboards(movies);
      res.status(200).json({ message: result });
    } catch (error) {
      console.log(error);
      if (error.message === "Cinema not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

// Pegar todos os filmes de um cinema
async function getAllCinemaMovies(req, res) {
    try {
        const { id } = req.params;
        const movies = await cinemaService.getAllCinemaMovies(id);
        res.status(200).send(movies);
    } catch (error) {
        console.log(error);
        if (error.message === "Cinema not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}

module.exports = cinemaController;