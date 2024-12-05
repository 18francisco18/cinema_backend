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
    getAllCinemaBillboards,
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

async function findAllCinemas(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = {};

    // Adicionar filtros de consulta
    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: "i" }; // Filtro por nome (case-insensitive)
    }
    if (req.query.address) {
      query.address = { $regex: req.query.address, $options: "i" }; // Filtro por endereço (case-insensitive)
    }
    if (req.query.movies) {
        query.movies = { $in: req.query.movies }; // Filtro por filmes em cartaz
    }
    const result = await cinemaService.findAll(page, limit, query);
    res.status(200).send(result);
  } catch (error) {
    next(error);
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

// Controlador para buscar as salas de um cinema pelo seu id
async function findCinemaRoomsById(req, res, next) {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = {};

    // Adicionar filtros de consulta
    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: "i" }; // Filtro por nome (case-insensitive)
    }
    if (req.query.capacity) {
      query.capacity = parseInt(req.query.capacity); // Filtro por capacidade
    }

    const result = await cinemaService.findRoomsById(id, page, limit, query);
    res.status(200).send(result);
  } catch (error) {
    next(error);
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
        console.log(req.params);
        const { id } = req.params;
        const { movieId } = req.params;
        const cinema = await cinemaService.addMovieToBillboard(id, [], movieId);
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

// Controlador para buscar todos os filmes de um cinema com paginação, filtragem e ordenação
async function getAllCinemaMovies(req, res, next) {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = {};
    const sort = req.query.sort ? JSON.parse(req.query.sort) : {};

    // Adicionar filtros de consulta
    if (req.query.title) {
      query.title = { $regex: req.query.title, $options: "i" }; // Filtro por título (case-insensitive)
    }
    if (req.query.genre) {
      query.genre = { $regex: req.query.genre, $options: "i" }; // Filtro por gênero (case-insensitive)
    }
    if (req.query.year) {
      query.year = parseInt(req.query.year); // Filtro por ano
    }

    if (req.query.rated) {
      query.rated = { $regex: req.query.rated, $options: "i" }; // Filtro por classificação
    }

    if (req.query.director) {
      query.director = { $regex: req.query.director, $options: "i" }; // Filtro por diretor
    }

    if (req.query.actors) {
        query.actors = { $in: req.query.actors }; // Filtro por atores
    }

    const result = await cinemaService.getAllCinemaMovies(id, page, limit, query, sort);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}

// Controlador para buscar todos os filmes de todos os cinemas com paginação, filtragem e ordenação
async function getAllCinemaBillboards(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const query = {};
    const sort = req.query.sort ? JSON.parse(req.query.sort) : {};

    // Adicionar filtros de consulta
    if (req.query.title) {
      query.title = { $regex: req.query.title, $options: "i" }; // Filtro por título (case-insensitive)
    }
    if (req.query.genre) {
      query.genre = { $regex: req.query.genre, $options: "i" }; // Filtro por gênero (case-insensitive)
    }
    if (req.query.year) {
      query.year = parseInt(req.query.year); // Filtro por ano
    }

    if (req.query.rated) {
      query.rated = { $regex: req.query.rated, $options: "i" }; // Filtro por classificação
    }

    if (req.query.director) {
      query.director = { $regex: req.query.director, $options: "i" }; // Filtro por diretor
    }

    if (req.query.actors) {
      query.actors = { $in: req.query.actors }; // Filtro por atores
    }

    const result = await cinemaService.getAllCinemaBillboards(page, limit, query, sort);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
}



module.exports = cinemaController;