const cinemaService = require('../cinema');


const cinemaController = {
    createCinema,
    findAllCinemas,
    findCinemaById,
    updateCinemaById,
    findCinemaRoomsById,
    removeCinemaRoomById,
    removeCinemaById,
    addMoviesToBillboard,
    addMoviesToBillboards,
    removeMovieFromCinema,
    removeMovieFromBillboards,
    getAllCinemaMovies,
}

// Controlador para criar um novo cinema.
async function createCinema(req, res, next) {
    try {
        const cinema = req.body;
        const newCinema = await cinemaService.create(cinema);
        res.status(201).send(newCinema);
    } catch (error) {
        next(error);
    }
}

// Controlador para buscar todos os cinemas.
async function findAllCinemas(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const cinemas = await cinemaService.findAll(page, limit);
        res.status(200).send(cinemas);
    } catch (error) {
        next(error)
    }
}

// Controlador para buscar um cinema pelo seu id.
async function findCinemaById(req, res, next) {
    try {
        const { id } = req.params;
        const cinema = await cinemaService.findById(id);
        res.status(200).send(cinema);
    } catch (error) {
        next(error)
    }
}

// Controlador para atualizar um cinema pelo seu id.
async function updateCinemaById(req, res, next) {
    try {
        const { id } = req.params;
        const cinema = req.body;
        const updatedCinema = await cinemaService.findByIdAndUpdate(id, cinema);
        res.status(200).send(updatedCinema);
    } catch (error) {
        console.log(error);
        next(error)
    }
}

// Controlador para buscar as salas de um cinema pelo seu id.
async function findCinemaRoomsById (req, res, next) {
    try {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const room = await cinemaService.findRoomsById(id, page, limit);
        res.status(200).send(room);
    } catch (error) {
        next(error)
    }
}

// Retira uma sala de um cinema, não elimina.
async function removeCinemaRoomById(req, res, next) {
    try {
        const { id, roomId } = req.params;
        await cinemaService.removeRoom(id, roomId);
        res.status(200).json({ message: "Room removed from cinema. Remaining rooms:", cinema: cinema.rooms });
    } catch (error) {
        next(error)
    }
}

// Controlador para remover um cinema e as respetivas salas associadas pelo seu id.
async function removeCinemaById(req, res, next) {
    try {
        const { id } = req.params;
        await cinemaService.removeCinemaById(id);
        res.status(204).json({ message: "Cinema and associated rooms deleted." });
    } catch (error) {
        next(error)
    }
}

// Controlador para adicionar filmes ao cartaz de um cinema.
async function addMoviesToBillboard(req, res, next) {
    try {
        const { id } = req.params;
        const { movies } = req.body;
        const cinema = await cinemaService.addMovieToBillboard(id, movies);
        res.status(200).send(cinema);
    } catch (error) {
        next(error);
    }
}

// Controlador para adicionar filmes a todos os cartazes de todos os cinemas.
async function addMoviesToBillboards(req, res, next) {
    try {
        const { movies } = req.body;
        const cinemas = await cinemaService.addMoviesToBillboards(movies);
        res.status(200).send(cinemas);
    } catch (error) {
        next(error);
    }
}

// Controlador para remover um filme de um cinema.
async function removeMovieFromCinema(req, res, next) {
    try {
        const { id, movieId } = req.params;
        const cinema = await cinemaService.removeMovie(id, movieId);
        res.status(200).send(cinema);
    } catch (error) {
        next(error)
    }
}

// Controlador para remover filmes de todos os cartazes de todos os cinemas.
async function removeMovieFromBillboards(req, res, next) {
    try {
        const { movies } = req.body;
        const cinemas = await cinemaService.removeMovies(movies);
        res.status(200).send(cinemas);
    } catch (error) {
        next(error)
    }
}

async function getAllCinemaMovies(req, res, next) {
    try {
        const { id } = req.params;
        const movies = await cinemaService.getAllCinemaMovies(id);
        res.status(200).send(movies);
    } catch (error) {
        next(error)
    }
}

module.exports = cinemaController;