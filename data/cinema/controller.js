const cinemaService = require('../cinema');



const cinemaController = {
    createCinema,
    findAllCinemas,
}

async function createCinema(req, res) {
    try {
        const cinema = req.body;
        const newCinema = await cinemaService.create(cinema);
        res.status(201).send(newCinema);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

async function findAllCinemas(req, res) {
    try {
        const cinemas = await cinemaService.findAll();
        res.status(200).send(cinemas);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

module.exports = cinemaController;